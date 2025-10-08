import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import QuizForm from '@/components/QuizForm';

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

export default async function QuizPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Get user from database
  const user = await retryOperation(() =>
    prisma.user.findUnique({
      where: { clerkId: userId },
    })
  );

  if (!user) {
    redirect('/sign-in');
  }

  // Get user's PDFs (only from Cloudinary)
  const pdfs = await retryOperation(() =>
    prisma.pDF.findMany({
      where: { 
        userId: user.id,
        // Only show PDFs with Cloudinary URLs (not local file paths)
        filePath: {
          startsWith: 'https://',
        },
      },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        title: true,
        subject: true,
        grade: true,
        totalPages: true,
      },
    })
  );

  // Get user's recent quiz attempts
  const recentAttempts = await retryOperation(() =>
    prisma.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: 'desc' },
      take: 5,
      include: {
        quiz: {
          select: {
            title: true,
            questionType: true,
            totalQuestions: true,
          },
        },
      },
    })
  );

  return <QuizForm pdfs={pdfs} recentAttempts={recentAttempts} />;
}
