import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Brain, MessageSquare, TrendingUp } from 'lucide-react';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden py-8 pb-12 min-h-[calc(100vh-120px)]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative border-b bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center group">
              <div className="bg-gradient-primary p-2.5 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <span className="ml-3 text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                ReviseAI
              </span>
            </div>
            <div className="flex gap-3 md:gap-4">
              <Link
                href="/sign-in"
                className="px-4 md:px-6 py-2 md:py-2.5 text-gray-700 hover:text-purple-600 font-semibold transition-all duration-300 hover:scale-105 rounded-lg hover:bg-purple-50"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 md:px-8 py-2 md:py-2.5 bg-gradient-primary text-white rounded-xl hover:shadow-xl font-semibold transition-all duration-300 hover:scale-105 transform btn-modern"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-28">
          <div className="text-center mb-12 md:mb-20 animate-fadeIn">
            <div className="inline-block mb-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold animate-scaleIn">
              🚀 AI-Powered Learning Platform
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Learn Smarter with
              <span className="block mt-2 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse-slow">
                AI-Powered Revision
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed">
              Upload your coursebooks, chat with AI tutor, generate quizzes, and track your progress. 
              Perfect for students preparing for exams. 📚✨
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/sign-up"
                className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-gradient-primary text-white rounded-2xl hover:shadow-2xl font-bold text-base md:text-lg transition-all duration-300 hover:scale-105 transform btn-modern"
              >
                Start Learning Free 🎓
              </Link>
              <Link
                href="/sign-in"
                className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-white text-purple-600 rounded-2xl hover:shadow-xl font-bold text-base md:text-lg transition-all duration-300 hover:scale-105 border-2 border-purple-200 hover:border-purple-400"
              >
                Watch Demo 🎬
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-16 md:mt-24">
            {[
              {
                icon: BookOpen,
                title: 'PDF Learning',
                description: 'Upload and interact with your coursebooks. AI understands your textbooks.',
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50',
                delay: '0ms'
              },
              {
                icon: Brain,
                title: 'AI Quizzes',
                description: 'Generate custom quizzes from your PDFs. Get instant feedback and explanations.',
                color: 'from-purple-500 to-purple-600',
                bgColor: 'bg-purple-50',
                delay: '100ms'
              },
              {
                icon: MessageSquare,
                title: 'Smart Chat',
                description: 'Ask questions and get answers with exact page references from your books.',
                color: 'from-green-500 to-green-600',
                bgColor: 'bg-green-50',
                delay: '200ms'
              },
              {
                icon: TrendingUp,
                title: 'Track Progress',
                description: 'Monitor your performance, identify weak areas, and improve systematically.',
                color: 'from-orange-500 to-orange-600',
                bgColor: 'bg-orange-50',
                delay: '300ms'
              }
            ].map((feature, index) => (
              <div
                key={index}
                style={{ animationDelay: feature.delay }}
                className="group p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-100 card-hover hover:shadow-2xl transition-all duration-500 animate-fadeInUp"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                  <feature.icon className="h-7 w-7 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3 text-gray-900 group-hover:text-purple-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-16 md:mt-24 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { number: '10K+', label: 'Students' },
              { number: '50K+', label: 'PDFs Analyzed' },
              { number: '100K+', label: 'Quizzes Generated' },
              { number: '98%', label: 'Success Rate' }
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 md:p-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-lg"
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-semibold text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
