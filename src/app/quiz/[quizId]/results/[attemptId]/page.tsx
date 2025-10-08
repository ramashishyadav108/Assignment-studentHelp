import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import QuizResults from '@/components/QuizResults';

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

export default async function QuizResultsPage({
  params,
}: {
  params: Promise<{ quizId: string; attemptId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await retryOperation(() =>
    prisma.user.findUnique({
      where: { clerkId: userId },
    })
  );

  if (!user) {
    redirect('/sign-in');
  }

  // Await params before using
  const { attemptId } = await params;

  // Get quiz attempt with all details
  const attempt = await retryOperation(() =>
    prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            pdf: {
              select: {
                id: true,
                title: true,
                filePath: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
          orderBy: {
            question: {
              order: 'asc',
            },
          },
        },
      },
    })
  );

  if (!attempt) {
    redirect('/quiz');
  }

  if (attempt.userId !== user.id) {
    redirect('/quiz');
  }

  return <QuizResults attempt={attempt} />;
}
