import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { BookOpen, Upload, FileText } from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';
import PDFListClient from '@/components/PDFListClient';

export default async function PDFsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      pdfs: {
        where: {
          // Only show PDFs with Cloudinary URLs (not local file paths)
          filePath: {
            startsWith: 'https://',
          },
        },
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 py-4 sm:py-6 pb-8 min-h-[calc(100vh-120px)]">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8 animate-fadeIn">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1 sm:mb-2">
              My PDFs
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              {user?.pdfs && user.pdfs.length > 0 
                ? `${user.pdfs.length} coursebook${user.pdfs.length !== 1 ? 's' : ''} in your library` 
                : 'Your digital library awaits'}
            </p>
          </div>
          <Link
            href="/pdfs/upload"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5 bg-gradient-primary text-white rounded-lg sm:rounded-xl hover:shadow-2xl text-sm sm:text-base font-semibold transition-all duration-300 hover:scale-105 transform btn-modern flex-shrink-0"
          >
            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
            Upload PDF
          </Link>
        </div>

        {user?.pdfs && user.pdfs.length > 0 ? (
          <PDFListClient pdfs={user.pdfs as any} />
        ) : (
          <div className="text-center py-16 md:py-24 bg-white/70 backdrop-blur-sm rounded-3xl border-2 border-dashed border-purple-200 animate-fadeIn">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-purple-100 to-blue-100 p-6 rounded-full">
                <FileText className="h-16 w-16 md:h-20 md:w-20 text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">No PDFs yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-sm md:text-base">
              Start your learning journey by uploading your first coursebook. 
              Transform your study materials into an interactive learning experience! 📚✨
            </p>
            <Link
              href="/pdfs/upload"
              className="inline-flex items-center gap-2 px-8 md:px-10 py-4 md:py-5 bg-gradient-primary text-white rounded-2xl hover:shadow-2xl font-bold transition-all duration-300 hover:scale-105 transform btn-modern"
            >
              <Upload className="h-5 w-5" />
              Upload Your First PDF
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
