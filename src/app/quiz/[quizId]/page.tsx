import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import QuizTaker from '@/components/QuizTaker';

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

export default async function QuizTakePage({ params }: { params: Promise<{ quizId: string }> }) {
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
  const { quizId } = await params;

  // Get quiz with questions
  const quiz = await retryOperation(() =>
    prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            questionText: true,
            options: true,
            order: true,
            points: true,
          },
        },
        pdf: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })
  );

  if (!quiz) {
    redirect('/quiz');
  }

  if (quiz.userId !== user.id) {
    redirect('/quiz');
  }

  return <QuizTaker quiz={quiz} userId={user.id} />;
}
