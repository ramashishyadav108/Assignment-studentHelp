import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Look up the PDF in the database to get Cloudinary URL
    const pdfRecord = await prisma.pDF.findFirst({
      where: { fileName: filename },
      select: { filePath: true },
    });

    if (!pdfRecord) {
      return NextResponse.json(
        { error: 'PDF not found in database' },
        { status: 404 }
      );
    }

    // Verify it's a valid Cloudinary URL
    if (!pdfRecord.filePath.startsWith('http://') && !pdfRecord.filePath.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Invalid PDF URL. Please re-upload this file.' },
        { status: 400 }
      );
    }

    // Redirect to Cloudinary URL
    return NextResponse.redirect(pdfRecord.filePath);
  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(
      { error: 'Failed to serve PDF' },
      { status: 500 }
    );
  }
}
