import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import type { Favorite } from '@prisma/client';

// Get user favorites
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

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      favorites: favorites.map((f: Favorite) => ({
        id: f.id,
        animeId: f.animeId,
        title: f.animeTitle,
        image: f.animeImage,
        score: f.animeScore,
        episodes: f.animeEpisodes,
        status: f.animeStatus,
        addedAt: f.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Add to favorites
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
    const { animeId, title, image, score, episodes, status } = body;

    if (!animeId || !title) {
      return NextResponse.json({ error: 'Anime ID and title required' }, { status: 400 });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findFirst({
      where: { userId: session.userId, animeId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already in favorites' }, { status: 400 });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.userId,
        animeId,
        animeTitle: title,
        animeImage: image || '',
        animeScore: score || null,
        animeEpisodes: episodes || null,
        animeStatus: status || null,
      },
    });

    return NextResponse.json({
      message: 'Added to favorites',
      favorite: {
        id: favorite.id,
        animeId: favorite.animeId,
        title: favorite.animeTitle,
        image: favorite.animeImage,
        addedAt: favorite.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Remove from favorites
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

    await prisma.favorite.deleteMany({
      where: { userId: session.userId, animeId },
    });

    return NextResponse.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
