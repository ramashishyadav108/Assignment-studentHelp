import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChatResponse } from '@/lib/gemini';
import { findRelevantChunks } from '@/lib/pdf-processor';

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

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

    // Generate AI response (with graceful fallback on model errors)
    let aiResponse: string;
    try {
      aiResponse = await generateChatResponse(message, context, pdfChunks);
    } catch (genErr: any) {
      console.error('AI generation failed, returning graceful fallback:', genErr?.message || genErr);
      // Friendly fallback message for users when model is temporarily unavailable
      aiResponse = `I'm having trouble generating a response right now because our AI service is temporarily unavailable. Please try again in a few moments. Meanwhile, here are some quick tips that might help:
\n- Try rephrasing your question to be shorter and more specific.
- If this question relates to the PDF, include the page number.
\nI'll retry automatically; thanks for your patience.`;
    }

    // Save assistant message (YouTube videos removed - only use dedicated YouTube recommendation feature)
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: 'assistant',
        content: aiResponse,
        pdfReferences: pdfChunks.length > 0 ? JSON.parse(JSON.stringify(pdfChunks)) : undefined,
        pdfId,
      },
    });

    return NextResponse.json({
      success: true,
      chatId: chat.id,
      message: assistantMessage,
    });
  } catch (error: any) {
    console.error('Error in chat:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name
    });

    return NextResponse.json(
      {
        error: 'Failed to process message',
        details: error?.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
