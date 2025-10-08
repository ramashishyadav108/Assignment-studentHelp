import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQuizQuestions } from '@/lib/gemini';
import { extractPDFText } from '@/lib/pdf-processor';

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const isLastRetry = i === retries - 1;
      const isConnectionError = error.message?.includes("Can't reach database server");

      if (isLastRetry || !isConnectionError) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { pdfId, questionType, questionCount, difficulty, timeLimit } = body;

    if (!pdfId || !questionType || !questionCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await retryOperation(() =>
      prisma.user.findUnique({
        where: { clerkId: userId },
      })
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get PDF
    const pdf = await retryOperation(() =>
      prisma.pDF.findUnique({
        where: { id: pdfId },
        include: {
          chunks: {
            orderBy: { chunkIndex: 'asc' },
            take: 50, // Limit chunks to avoid token limits
          },
        },
      })
    );

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    if (pdf.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Extract PDF text or use chunks
    let content = '';
    if (pdf.chunks && pdf.chunks.length > 0) {
      content = pdf.chunks.map((chunk) => chunk.content).join('\n\n');
    } else {
      // Fallback: extract text from PDF file
      const extracted = await extractPDFText(pdf.filePath);
      content = extracted.text;
    }

    // Generate quiz questions using AI
    const aiResponse = await generateQuizQuestions(
      content,
      questionType,
      questionCount,
      difficulty
    );

    // Create quiz in database
    const quiz = await retryOperation(() =>
      prisma.quiz.create({
        data: {
          title: `${pdf.title} - ${questionType} Quiz`,
          description: `${questionCount} ${questionType} questions from ${pdf.title}`,
          questionType,
          difficulty,
          totalQuestions: questionCount,
          userId: user.id,
          pdfId: pdf.id,
        },
      })
    );

    // Create questions
    await retryOperation(() =>
      Promise.all(
        aiResponse.questions.map((q: any, index: number) =>
          prisma.question.create({
            data: {
              quizId: quiz.id,
              type: q.type || questionType,
              questionText: q.question,
              options: q.options || null,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || null,
              pageReference: q.pageReference || null,
              points: questionType === 'LAQ' ? 5 : questionType === 'SAQ' ? 3 : 1,
              order: index,
            },
          })
        )
      )
    );

    return NextResponse.json({
      success: true,
      quizId: quiz.id,
      timeLimit,
      message: 'Quiz generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
