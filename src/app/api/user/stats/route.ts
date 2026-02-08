import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Получаем статистику
    const [favorites, watching, completed, planning] = await Promise.all([
      prisma.favorite.count({ where: { userId: session.userId } }),
      prisma.watchlist.count({ where: { userId: session.userId, status: 'WATCHING' } }),
      prisma.watchlist.count({ where: { userId: session.userId, status: 'COMPLETED' } }),
      prisma.watchlist.count({ where: { userId: session.userId, status: 'PLAN_TO_WATCH' } }),
    ]);

    return NextResponse.json({
      stats: {
        favorites,
        watching,
        completed,
        planning,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
