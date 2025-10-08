import { auth, currentUser } from '@clerk/nextjs/server';
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

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already exists with retry logic
    const existingUser = await retryOperation(() =>
      prisma.user.findUnique({
        where: { clerkId: userId },
      })
    );

    if (existingUser) {
      return NextResponse.json({ success: true, user: existingUser });
    }

    // Create user from Clerk data
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
    }

    const user = await retryOperation(() =>
      prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0].emailAddress,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
          imageUrl: clerkUser.imageUrl || null,
        },
      })
    );

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    // Only log non-connection errors to avoid console spam
    if (!error.message?.includes("Can't reach database server")) {
      console.error('Error syncing user:', error);
    }
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}
