import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import type { WatchHistory } from '@prisma/client';

// Get watch history
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
    });
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const history = await prisma.watchHistory.findMany({
      where: { userId: session.userId },
      orderBy: { watchedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      history: history.map((h: WatchHistory) => ({
        id: h.id,
        animeId: h.animeId,
        title: h.animeTitle,
        image: h.animeImage,
        episode: h.episode,
        progress: h.progress,
        watchedAt: h.watchedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Add to history
export async function POST(request: Request) {
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
    const { animeId, title, image, episode, progress } = body;

    if (!animeId || !title || !episode) {
      return NextResponse.json({ error: 'Anime ID, title, and episode required' }, { status: 400 });
    }

    // Upsert - update if exists, create if not
    const existing = await prisma.watchHistory.findFirst({
      where: {
        userId: session.userId,
        animeId,
        episode,
      },
    });

    if (existing) {
      await prisma.watchHistory.update({
        where: { id: existing.id },
        data: {
          progress: progress || existing.progress,
          watchedAt: new Date(),
        },
      });
    } else {
      await prisma.watchHistory.create({
        data: {
          userId: session.userId,
          animeId,
          animeTitle: title,
          animeImage: image || '',
          episode,
          progress: progress || 0,
        },
      });
    }

    // Also update watchlist progress if in watchlist
    const watchlistItem = await prisma.watchlist.findFirst({
      where: { userId: session.userId, animeId },
    });

    if (watchlistItem && episode > watchlistItem.progress) {
      await prisma.watchlist.update({
        where: { id: watchlistItem.id },
        data: {
          progress: episode,
          status: watchlistItem.totalEpisodes && episode >= watchlistItem.totalEpisodes ? 'completed' : 'watching',
        },
      });
    }

    return NextResponse.json({ message: 'History updated' });
  } catch (error) {
    console.error('Add to history error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Clear all history
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

    await prisma.watchHistory.deleteMany({
      where: { userId: session.userId },
    });

    return NextResponse.json({ message: 'History cleared' });
  } catch (error) {
    console.error('Clear history error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
