import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, decryptData, encryptData, verifyPassword, hashPassword } from '@/lib/auth';

// Get user settings
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const session = await prisma.session.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const user = session.user;
    const decryptedEmail = decryptData(user.email);
    const decryptedDisplayName = user.displayName ? decryptData(user.displayName) : '';

    return NextResponse.json({
      settings: {
        displayName: decryptedDisplayName,
        email: decryptedEmail,
        language: user.language || 'en',
        theme: user.theme || 'dark',
        notifications: user.notificationSettings ? JSON.parse(user.notificationSettings) : {
          newEpisodes: true,
          recommendations: true,
          updates: false,
        },
        privacy: user.privacySettings ? JSON.parse(user.privacySettings) : {
          showProfile: true,
          showWatchlist: true,
          showFavorites: true,
        },
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Update user settings
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const session = await prisma.session.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
    });
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, language, theme, notifications, privacy } = body;

    const updateData: Record<string, string | null> = {};

    if (displayName !== undefined) {
      updateData.displayName = displayName ? encryptData(displayName) : null;
    }
    if (language) {
      updateData.language = language;
    }
    if (theme) {
      updateData.theme = theme;
    }
    if (notifications) {
      updateData.notificationSettings = JSON.stringify(notifications);
    }
    if (privacy) {
      updateData.privacySettings = JSON.stringify(privacy);
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
