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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        {/* Welcome Header */}
        <div className="mb-8 md:mb-12 animate-fadeIn">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600">Your AI-powered learning companion</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <Link
            href="/pdfs/upload"
            className="group relative p-6 md:p-8 bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-purple-200 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Upload className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="font-bold text-base md:text-lg mb-1 text-gray-900">Upload PDF</h3>
              <p className="text-xs md:text-sm text-gray-600">Add new coursebooks</p>
            </div>
          </Link>

          <Link
            href="/pdfs"
            className="group relative p-6 md:p-8 bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-200 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="font-bold text-base md:text-lg mb-1 text-gray-900">My PDFs</h3>
              <p className="text-xs md:text-sm text-gray-600">View your library</p>
            </div>
          </Link>

          <Link
            href="/quiz"
            className="group relative p-6 md:p-8 bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-pink-200 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Brain className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="font-bold text-base md:text-lg mb-1 text-gray-900">Generate Quiz</h3>
              <p className="text-xs md:text-sm text-gray-600">Test your knowledge</p>
            </div>
          </Link>

          <Link
            href="/progress"
            className="group relative p-6 md:p-8 bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-orange-200 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="font-bold text-base md:text-lg mb-1 text-gray-900">View Progress</h3>
              <p className="text-xs md:text-sm text-gray-600">Track performance</p>
            </div>
          </Link>
        </div>

        {/* Getting Started Card */}
        <div className="glass rounded-3xl shadow-2xl border border-gray-200 p-6 md:p-10 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-primary p-3 rounded-xl shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Getting Started</h2>
          </div>
          <ol className="space-y-4 md:space-y-5">
            {[
              'Upload your coursebook PDFs or use pre-loaded NCERT textbooks',
              'Chat with AI to ask questions and get explanations with page references',
              'Generate quizzes (MCQs, SAQs, LAQs) to test your understanding',
              'Track your progress and identify areas for improvement'
            ].map((step, index) => (
              <li key={index} className="flex items-start group">
                <span className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-primary text-white font-bold text-sm md:text-base mr-3 md:mr-4 mt-0.5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {index + 1}
                </span>
                <span className="text-sm md:text-base text-gray-700 leading-relaxed pt-1 md:pt-2">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
