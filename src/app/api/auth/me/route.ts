import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, decryptData } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Проверка сессии в базе
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const user = session.user;
    const decryptedUsername = decryptData(user.username);
    const decryptedDisplayName = user.displayName ? decryptData(user.displayName) : decryptedUsername;

    return NextResponse.json({
      user: {
        id: user.id,
        username: decryptedUsername,
        displayName: decryptedDisplayName,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
