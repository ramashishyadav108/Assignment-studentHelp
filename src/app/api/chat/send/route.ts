import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChatResponse } from '@/lib/gemini';
import { findRelevantChunks } from '@/lib/pdf-processor';
import { searchYouTubeVideos } from '@/lib/youtube';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, message, pdfId } = await req.json();

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let chat = chatId
      ? await prisma.chat.findUnique({ where: { id: chatId } })
      : null;

    // Create new chat if needed
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          userId: user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: 'user',
        content: message,
        pdfId,
      },
    });

    // Get relevant PDF chunks if pdfId provided
    let pdfChunks: Array<{ content: string; pageNumber: number }> = [];
    let context = '';

    if (pdfId) {
      const pdf = await prisma.pDF.findUnique({
        where: { id: pdfId },
        include: { chunks: true },
      });

      if (pdf) {
        const vocabulary = (pdf.vocabulary as string[]) || [];
        const relevantChunks = findRelevantChunks(
          message,
          pdf.chunks.map((c) => ({
            content: c.content,
            embedding: c.embedding as number[],
          })),
          vocabulary,
          3
        );

        pdfChunks = relevantChunks.map((rc: any) => ({
          content: pdf.chunks[rc.index].content,
          pageNumber: pdf.chunks[rc.index].pageNumber,
        }));

        context = `PDF: ${pdf.title}\n${pdfChunks.map((c: any) => c.content).join('\n\n')}`;
      }
    }

    // Generate AI response
    const aiResponse = await generateChatResponse(message, context, pdfChunks);

    // Search for related YouTube videos
    const videos = await searchYouTubeVideos(message, 3);

    // Save assistant message
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: 'assistant',
        content: aiResponse,
        pdfReferences: pdfChunks.length > 0 ? JSON.parse(JSON.stringify(pdfChunks)) : undefined,
        videoReferences: videos.length > 0 ? JSON.parse(JSON.stringify(videos)) : undefined,
        pdfId,
      },
    });

    return NextResponse.json({
      success: true,
      chatId: chat.id,
      message: assistantMessage,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
