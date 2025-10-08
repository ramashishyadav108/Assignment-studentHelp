import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { extractPDFText, chunkPDFText, generateTextEmbedding } from '@/lib/pdf-processor';
import { extractKeyTopics } from '@/lib/gemini';
import { uploadPDFToCloudinary } from '@/lib/cloudinary';

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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const subject = formData.get('subject') as string || null;
    const grade = formData.get('grade') as string || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get user from database with retry logic
    const user = await retryOperation(() =>
      prisma.user.findUnique({
        where: { clerkId: userId },
      })
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name}`;

    // Upload to Cloudinary
    const cloudinaryResult = await uploadPDFToCloudinary(buffer, file.name);

    // Create temporary file for PDF processing (needed for pdf-parse)
    const tempDir = join(process.cwd(), 'temp');
    await mkdir(tempDir, { recursive: true });
    const tempFilePath = join(tempDir, fileName);
    await writeFile(tempFilePath, buffer);

    // Extract PDF text and metadata
    const { title, totalPages, text } = await extractPDFText(tempFilePath);

    // Delete temporary file after extraction
    try {
      await unlink(tempFilePath);
    } catch (error) {
      console.warn('Failed to delete temp file:', error);
    }

    // Chunk the text and create embeddings
    const chunks = chunkPDFText(text);
    const vocabulary = Array.from(new Set(text.toLowerCase().split(/\W+/).filter(w => w.length > 2))).slice(0, 500);

    // Create PDF record with Cloudinary URL and metadata
    const pdf = await retryOperation(() =>
      prisma.pDF.create({
        data: {
          title: title || file.name,
          fileName,
          filePath: cloudinaryResult.secure_url, // Store Cloudinary URL instead of local path
          fileSize: cloudinaryResult.bytes,
          totalPages,
          subject,
          grade,
          source: 'User Upload',
          vocabulary: vocabulary,
          userId: user.id,
        },
      })
    );

    await retryOperation(() =>
      Promise.all(
        chunks.map(async (chunk) => {
          const embedding = generateTextEmbedding(chunk.content, vocabulary);
          return prisma.pDFChunk.create({
            data: {
              pdfId: pdf.id,
              content: chunk.content,
              pageNumber: chunk.pageNumber,
              chunkIndex: chunk.chunkIndex,
              embedding,
            },
          });
        })
      )
    );

    // Extract topics for better search
    let topics: string[] = [];
    try {
      topics = await extractKeyTopics(text.substring(0, 5000));
    } catch (error) {
      console.error('Error extracting topics:', error);
      // Continue without topics if extraction fails
    }

    return NextResponse.json({
      success: true,
      pdf: {
        id: pdf.id,
        title: pdf.title,
        totalPages: pdf.totalPages,
        subject: pdf.subject,
        grade: pdf.grade,
        topics,
      },
    });
  } catch (error: any) {
    // Only log non-connection errors to avoid console spam
    if (!error.message?.includes("Can't reach database server")) {
      console.error('Error uploading PDF:', error);
    }
    return NextResponse.json(
      { error: 'Failed to upload PDF' },
      { status: 500 }
    );
  }
}
