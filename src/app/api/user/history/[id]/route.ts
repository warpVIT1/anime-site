import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Delete single history entry
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Make sure user owns this history entry
    const entry = await prisma.watchHistory.findFirst({
      where: { id, userId: session.userId },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    await prisma.watchHistory.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Entry deleted' });
  } catch (error) {
    console.error('Delete history entry error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
