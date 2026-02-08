import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import type { Watchlist } from '@prisma/client';

// Get user watchlist
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

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      watchlist: watchlist.map((w: Watchlist) => ({
        id: w.id,
        animeId: w.animeId,
        title: w.animeTitle,
        image: w.animeImage,
        status: w.status,
        progress: w.progress,
        totalEpisodes: w.totalEpisodes,
        score: w.score,
        updatedAt: w.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Add to watchlist
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
    const { animeId, title, image, status, totalEpisodes } = body;

    if (!animeId || !title) {
      return NextResponse.json({ error: 'Anime ID and title required' }, { status: 400 });
    }

    // Check if already in watchlist
    const existing = await prisma.watchlist.findFirst({
      where: { userId: session.userId, animeId },
    });

    if (existing) {
      // Update existing entry
      const updated = await prisma.watchlist.update({
        where: { id: existing.id },
        data: { status: status || existing.status },
      });

      return NextResponse.json({
        message: 'Watchlist updated',
        item: {
          id: updated.id,
          animeId: updated.animeId,
          status: updated.status,
        },
      });
    }

    const item = await prisma.watchlist.create({
      data: {
        userId: session.userId,
        animeId,
        animeTitle: title,
        animeImage: image || '',
        status: status || 'planned',
        progress: 0,
        totalEpisodes: totalEpisodes || null,
      },
    });

    return NextResponse.json({
      message: 'Added to watchlist',
      item: {
        id: item.id,
        animeId: item.animeId,
        title: item.animeTitle,
        status: item.status,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Update watchlist item
export async function PATCH(request: Request) {
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
    const { animeId, status, progress, score } = body;

    if (!animeId) {
      return NextResponse.json({ error: 'Anime ID required' }, { status: 400 });
    }

    const existing = await prisma.watchlist.findFirst({
      where: { userId: session.userId, animeId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not in watchlist' }, { status: 404 });
    }

    const updated = await prisma.watchlist.update({
      where: { id: existing.id },
      data: {
        ...(status && { status }),
        ...(progress !== undefined && { progress }),
        ...(score !== undefined && { score }),
      },
    });

    return NextResponse.json({
      message: 'Watchlist updated',
      item: {
        id: updated.id,
        animeId: updated.animeId,
        status: updated.status,
        progress: updated.progress,
        score: updated.score,
      },
    });
  } catch (error) {
    console.error('Update watchlist error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Remove from watchlist
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

    const body = await request.json();
    const { animeId } = body;

    if (!animeId) {
      return NextResponse.json({ error: 'Anime ID required' }, { status: 400 });
    }

    await prisma.watchlist.deleteMany({
      where: { userId: session.userId, animeId },
    });

    return NextResponse.json({ message: 'Removed from watchlist' });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
