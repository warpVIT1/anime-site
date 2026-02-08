import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  hashPassword,
  createSearchHash,
  encryptData,
  createToken,
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    console.log('Registration request received');
    const body = await request.json();
    console.log('Body parsed:', { email: body.email, username: body.username, hasPassword: !!body.password });
    const { email, username, password, displayName } = body;

    // Валидация
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, username and password are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const usernameValidation = isValidUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: usernameValidation.message },
        { status: 400 }
      );
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Проверка существующего пользователя
    console.log('Creating search hashes...');
    const emailHash = createSearchHash(email);
    const usernameHash = createSearchHash(username);
    console.log('Search hashes created');

    console.log('Checking existing user...');
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { emailHash },
          { usernameHash },
        ],
      },
    });
    console.log('Existing user check done:', existingUser ? 'found' : 'not found');

    if (existingUser) {
      if (existingUser.emailHash === emailHash) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Шифрование данных
    console.log('Encrypting data...');
    const encryptedEmail = encryptData(email);
    const encryptedUsername = encryptData(username);
    const encryptedDisplayName = displayName ? encryptData(displayName) : null;
    console.log('Data encrypted');
    
    console.log('Hashing password...');
    const passwordHash = await hashPassword(password);
    console.log('Password hashed');

    // Создание пользователя
    console.log('Creating user...');
    const user = await prisma.user.create({
      data: {
        email: encryptedEmail,
        emailHash,
        username: encryptedUsername,
        usernameHash,
        passwordHash,
        displayName: encryptedDisplayName,
      },
    });
    console.log('User created:', user.id);

    // Создание токена
    const token = await createToken({ userId: user.id, email });

    // Создание сессии
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user.id,
          username,
          displayName: displayName || username,
        },
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Server error', details: errorMessage },
      { status: 500 }
    );
  }
}
