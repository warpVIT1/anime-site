import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyPassword,
  createSearchHash,
  decryptData,
  createToken,
  isValidEmail,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login, password } = body;

    // Валидация
    if (!login || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      );
    }

    // Определяем тип входа (email или username)
    const isEmail = isValidEmail(login);
    const searchHash = createSearchHash(login);

    // Поиск пользователя
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { emailHash: searchHash }
        : { usernameHash: searchHash },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid login or password' },
        { status: 401 }
      );
    }

    // Проверка пароля
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid login or password' },
        { status: 401 }
      );
    }

    // Расшифровка данных для ответа
    const decryptedEmail = decryptData(user.email);
    const decryptedUsername = decryptData(user.username);
    const decryptedDisplayName = user.displayName ? decryptData(user.displayName) : decryptedUsername;

    // Создание токена
    const token = await createToken({ userId: user.id, email: decryptedEmail });

    // Удаление старых сессий и создание новой
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() },
      },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: decryptedUsername,
        displayName: decryptedDisplayName,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
