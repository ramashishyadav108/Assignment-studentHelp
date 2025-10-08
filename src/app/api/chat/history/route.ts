import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all chats for the user with their messages
    const chats = await prisma.chat.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            pdfId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      chats: chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messages: chat.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          text: msg.content,
          pdfId: msg.pdfId,
          createdAt: msg.createdAt,
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
