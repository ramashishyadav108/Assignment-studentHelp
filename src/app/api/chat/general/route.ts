import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Generate AI response without PDF context
    const aiResponse = await generateChatResponse(question, '', []);

    return NextResponse.json({
      success: true,
      answer: aiResponse,
    });
  } catch (error) {
    console.error('Error in general chat:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}
