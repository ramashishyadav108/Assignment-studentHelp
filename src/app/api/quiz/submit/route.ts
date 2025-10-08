import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

function evaluateAnswer(userAnswer: string, correctAnswer: string, questionType: string): { isCorrect: boolean; score: number } {
  const normalizedUser = (userAnswer || '').trim().toLowerCase();
  const normalizedCorrect = (correctAnswer || '').trim().toLowerCase();

  // If user didn't attempt the question, treat as unattempted -> zero score
  if (!normalizedUser) {
    return { isCorrect: false, score: 0 };
  }

  if (questionType === 'MCQ') {
    // For MCQ, exact match required
    return {
      isCorrect: normalizedUser === normalizedCorrect,
      score: normalizedUser === normalizedCorrect ? 1 : 0,
    };
  } else if (questionType === 'SAQ') {
    // For SAQ, check if key terms are present
    const correctTerms = normalizedCorrect.split(/\s+/).filter(t => t.length > 3);
    const userTerms = normalizedUser.split(/\s+/);
    const matchedTerms = correctTerms.filter(term => userTerms.some(ut => ut.includes(term) || term.includes(ut)));
    const matchRatio = correctTerms.length > 0 ? matchedTerms.length / correctTerms.length : 0;

    return {
      isCorrect: matchRatio >= 0.5,
      score: matchRatio,
    };
  } else {
    // For LAQ, more lenient scoring
    const correctTerms = normalizedCorrect.split(/\s+/).filter(t => t.length > 3);
    const userTerms = normalizedUser.split(/\s+/);
    const matchedTerms = correctTerms.filter(term => userTerms.some(ut => ut.includes(term) || term.includes(ut)));
    const matchRatio = correctTerms.length > 0 ? matchedTerms.length / correctTerms.length : 0;

    return {
      isCorrect: matchRatio >= 0.3,
      score: Math.min(1, matchRatio * 1.5), // Allow partial credit
    };
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { quizId, answers, timeTaken } = body;

    const user = await retryOperation(() =>
      prisma.user.findUnique({
        where: { clerkId: userId },
      })
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const quiz = await retryOperation(() =>
      prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: true },
      })
    );

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    let totalScore = 0;
    let totalPossible = 0;

    // Calculate score for each answer
    const answerData = quiz.questions.map((question) => {
      const userAnswer = answers[question.id] || '';
      const evaluation = evaluateAnswer(userAnswer, question.correctAnswer, question.type);
      const pointsEarned = evaluation.score * question.points;

      totalScore += pointsEarned;
      totalPossible += question.points;

      return {
        questionId: question.id,
        userAnswer,
        isCorrect: evaluation.isCorrect,
        pointsEarned,
      };
    });

    const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

    // Create quiz attempt
    const attempt = await retryOperation(() =>
      prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          userId: user.id,
          score: totalScore,
          totalScore: totalPossible,
          percentage,
          timeTaken,
        },
      })
    );

    // Create answers
    await retryOperation(() =>
      Promise.all(
        answerData.map((ans) =>
          prisma.answer.create({
            data: {
              attemptId: attempt.id,
              questionId: ans.questionId,
              userAnswer: ans.userAnswer,
              isCorrect: ans.isCorrect,
              pointsEarned: ans.pointsEarned,
            },
          })
        )
      )
    );

    // Update progress
    if (quiz.pdfId) {
      const pdfData = await retryOperation(() =>
        prisma.pDF.findUnique({ where: { id: quiz.pdfId! } })
      );
      const subject = pdfData?.subject || 'General';
      const topic = quiz.title;

      const existingProgress = await retryOperation(() =>
        prisma.progress.findUnique({
          where: {
            userId_subject_topic: {
              userId: user.id,
              subject,
              topic,
            },
          },
        })
      );

      const newTotalQuizzes = (existingProgress?.totalQuizzes || 0) + 1;
      const newTotalScore = (existingProgress?.totalScore || 0) + percentage;
      const newAverageScore = newTotalScore / newTotalQuizzes;

      await retryOperation(() =>
        prisma.progress.upsert({
          where: {
            userId_subject_topic: {
              userId: user.id,
              subject,
              topic,
            },
          },
          update: {
            totalQuizzes: newTotalQuizzes,
            totalScore: newTotalScore,
            averageScore: newAverageScore,
            lastActivity: new Date(),
          },
          create: {
            userId: user.id,
            subject,
            topic,
            totalQuizzes: 1,
            totalScore: percentage,
            averageScore: percentage,
          },
        })
      );
    }

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      score: totalScore,
      totalScore: totalPossible,
      percentage,
    });
  } catch (error: any) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
