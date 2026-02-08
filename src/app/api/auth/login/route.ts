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
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json({ error: 'Email/username and password are required' }, { status: 400 });
    }

    const isEmail = isValidEmail(login);
    const searchHash = createSearchHash(login);

    const user = await prisma.user.findFirst({
      where: isEmail ? { emailHash: searchHash } : { usernameHash: searchHash },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid login or password' }, { status: 401 });
    }

    const decryptedEmail = decryptData(user.email);
    const decryptedUsername = decryptData(user.username);
    const decryptedDisplayName = user.displayName ? decryptData(user.displayName) : decryptedUsername;

    const token = await createToken({ userId: user.id, email: decryptedEmail });

    // cleanup old sessions
    await prisma.session.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: { userId: user.id, token, expiresAt },
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
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
