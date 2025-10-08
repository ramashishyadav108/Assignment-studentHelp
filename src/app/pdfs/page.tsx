import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { BookOpen, Upload, FileText } from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12 animate-fadeIn">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              My PDFs
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {user?.pdfs && user.pdfs.length > 0 
                ? `${user.pdfs.length} coursebook${user.pdfs.length !== 1 ? 's' : ''} in your library` 
                : 'Your digital library awaits'}
            </p>
          </div>
          <Link
            href="/pdfs/upload"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-3.5 bg-gradient-primary text-white rounded-xl hover:shadow-2xl font-semibold transition-all duration-300 hover:scale-105 transform btn-modern"
          >
            <Upload className="h-5 w-5" />
            Upload PDF
          </Link>
        </div>

        {user?.pdfs && user.pdfs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {user.pdfs.map((pdf, index) => (
              <Link
                key={pdf.id}
                href={`/pdfs/${pdf.id}`}
                style={{ animationDelay: `${index * 50}ms` }}
                className="group bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-2xl transition-all duration-300 overflow-hidden card-hover animate-fadeInUp"
              >
                {/* Decorative gradient background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/50 to-blue-100/50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  {/* Icon & Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
                      <FileText className="h-7 w-7 text-purple-600" />
                    </div>
                    {pdf.subject && (
                      <span className="inline-block px-3 py-1 bg-gradient-primary text-white text-xs font-semibold rounded-full shadow-md">
                        {pdf.subject}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {pdf.title}
                  </h3>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="text-gray-600 font-medium">{pdf.totalPages} pages</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-gray-600 font-medium">{formatFileSize(pdf.fileSize)}</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      📅 Uploaded {formatDate(pdf.uploadedAt)}
                    </p>
                  </div>

                  {/* Hover effect indicator */}
                  <div className="mt-4 flex items-center gap-2 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-sm font-semibold">View PDF</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
