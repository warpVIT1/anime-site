import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Delete user account
export async function DELETE(request: Request) {
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

    // Delete all user data
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: session.userId } }),
      prisma.favorite.deleteMany({ where: { userId: session.userId } }),
      prisma.watchlist.deleteMany({ where: { userId: session.userId } }),
      prisma.watchHistory.deleteMany({ where: { userId: session.userId } }),
      prisma.user.delete({ where: { id: session.userId } }),
    ]);

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
