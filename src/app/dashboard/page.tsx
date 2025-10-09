import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { BookOpen, Brain, MessageSquare, Upload, TrendingUp, FileText } from 'lucide-react';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-6">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Welcome Header */}
        <div className="mb-4 sm:mb-6 md:mb-8 animate-fadeIn">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1 sm:mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">Your AI-powered learning companion</p>
        </div>

        {/* Quick Actions Grid - 2 per row on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 mb-6 md:mb-8 lg:mb-12">
          <Link
            href="/pdfs/upload"
            className="group relative p-3 sm:p-4 md:p-5 lg:p-6 bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-transparent hover:border-purple-200 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-purple-100 to-transparent rounded-full -mr-10 sm:-mr-12 md:-mr-16 -mt-10 sm:-mt-12 md:-mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl w-fit mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Upload className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="font-bold text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 text-gray-900">Upload PDF</h3>
              <p className="text-xs sm:text-sm text-gray-600">Add new coursebooks</p>
            </div>
          </Link>

          <Link
            href="/pdfs"
            className="group relative p-3 sm:p-4 md:p-5 lg:p-6 bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-200 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-10 sm:-mr-12 md:-mr-16 -mt-10 sm:-mt-12 md:-mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl w-fit mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FileText className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="font-bold text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 text-gray-900">My PDFs</h3>
              <p className="text-xs sm:text-sm text-gray-600">View your library</p>
            </div>
          </Link>

          <Link
            href="/quiz"
            className="group relative p-3 sm:p-4 md:p-5 lg:p-6 bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-transparent hover:border-pink-200 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-pink-100 to-transparent rounded-full -mr-10 sm:-mr-12 md:-mr-16 -mt-10 sm:-mt-12 md:-mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl w-fit mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Brain className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="font-bold text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 text-gray-900">Generate Quiz</h3>
              <p className="text-xs sm:text-sm text-gray-600">Test your knowledge</p>
            </div>
          </Link>

          <Link
            href="/progress"
            className="group relative p-3 sm:p-4 md:p-5 lg:p-6 bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-transparent hover:border-orange-200 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-orange-100 to-transparent rounded-full -mr-10 sm:-mr-12 md:-mr-16 -mt-10 sm:-mt-12 md:-mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl w-fit mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="font-bold text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 text-gray-900">View Progress</h3>
              <p className="text-xs sm:text-sm text-gray-600">Track performance</p>
            </div>
          </Link>
        </div>

        {/* Getting Started Card */}
        <div className="glass rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 p-4 sm:p-6 md:p-8 lg:p-10 animate-fadeIn">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
            <div className="bg-gradient-primary p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
            </div>
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Getting Started</h2>
          </div>
          <ol className="space-y-3 sm:space-y-4 md:space-y-5">
            {[
              'Upload your coursebook PDFs or use pre-loaded NCERT textbooks',
              'Chat with AI to ask questions and get explanations with page references',
              'Generate quizzes (MCQs, SAQs, LAQs) to test your understanding',
              'Track your progress and identify areas for improvement'
            ].map((step, index) => (
              <li key={index} className="flex items-start group">
                <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-gradient-primary text-white font-bold text-xs sm:text-sm md:text-base mr-2 sm:mr-3 md:mr-4 mt-0.5 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed pt-0.5 sm:pt-1 md:pt-2">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
