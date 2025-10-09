'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { BookOpen, Brain, Clock, FileText, CheckCircle2, TrendingUp } from 'lucide-react';

type PDF = {
  id: string;
  title: string;
  subject: string | null;
  grade: string | null;
  totalPages: number;
};

type QuizAttempt = {
  id: string;
  score: number;
  totalScore: number;
  percentage: number;
  completedAt: Date;
  quiz: {
    title: string;
    questionType: string;
    totalQuestions: number;
  };
};

type Props = {
  pdfs: PDF[];
  recentAttempts: QuizAttempt[];
};

export default function QuizForm({ pdfs, recentAttempts }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    pdfId: '',
    questionType: 'MCQ' as 'MCQ' | 'SAQ' | 'LAQ' | 'Mixed',
    questionCount: 5,
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    timeLimit: 10, // minutes
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.pdfId) {
        setError('Please select a PDF');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      // Redirect to quiz taking page
      router.push(`/quiz/${data.quizId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 py-6 pb-12 min-h-[calc(100vh-120px)]">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        {/* Page Header */}
        <div className="mb-8 md:mb-12 animate-fadeIn">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Create Your Quiz
          </h1>
          <p className="text-sm md:text-base text-gray-600">Generate AI-powered quizzes from your study materials 🧠✨</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Quiz Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 p-6 md:p-8 card-hover animate-fadeInUp">
              <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="bg-gradient-primary p-3 rounded-xl shadow-lg">
                  <Brain className="h-7 w-7 md:h-8 md:w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Quiz Generator</h2>
                  <p className="text-sm md:text-base text-gray-600">Customize your learning experience</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 animate-scaleIn">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <span className="font-semibold">{error}</span>
                  </div>
                </div>
              )}

              {pdfs.length === 0 ? (
                <div className="text-center py-12 md:py-16">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-20 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-purple-100 to-blue-100 p-6 rounded-full">
                      <FileText className="h-16 w-16 md:h-20 md:w-20 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 text-base md:text-lg">No PDFs uploaded yet. Upload one to get started!</p>
                  <Link
                    href="/pdfs"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-white rounded-xl hover:shadow-2xl font-bold transition-all duration-300 hover:scale-105 btn-modern"
                  >
                    <FileText className="h-5 w-5" />
                    Upload PDF
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                  {/* PDF Selection */}
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                      Select PDF
                    </label>
                    <select
                      value={formData.pdfId}
                      onChange={(e) => setFormData({ ...formData, pdfId: e.target.value })}
                      className="w-full px-4 md:px-5 py-3 md:py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all text-sm md:text-base font-medium shadow-sm hover:border-purple-300"
                      required
                    >
                      <option value="">Choose a PDF...</option>
                      {pdfs.map((pdf) => (
                        <option key={pdf.id} value={pdf.id}>
                          {pdf.title} {pdf.subject && `• ${pdf.subject}`} {pdf.grade && `• ${pdf.grade}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Question Type */}
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      Question Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(['MCQ', 'SAQ', 'LAQ', 'Mixed'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, questionType: type })}
                          className={`px-4 py-3 md:py-4 rounded-xl border-2 font-semibold transition-all duration-300 hover:scale-105 ${
                            formData.questionType === type
                              ? 'border-purple-600 bg-gradient-to-br from-purple-50 to-blue-50 text-purple-700 shadow-lg'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          {type === 'MCQ' && '📝 Multiple Choice'}
                          {type === 'SAQ' && '✍️ Short Answer'}
                          {type === 'LAQ' && '📄 Long Answer'}
                          {type === 'Mixed' && '🎲 Mixed'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Count */}
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-gray-700 mb-3">
                      Number of Questions: <span className="text-purple-600 text-lg md:text-xl">{formData.questionCount}</span>
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="20"
                      value={formData.questionCount}
                      onChange={(e) =>
                        setFormData({ ...formData, questionCount: parseInt(e.target.value) })
                      }
                      className="w-full h-3 bg-gray-300 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-xl [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-xl [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:appearance-none"
                    />
                    <div className="flex justify-between text-xs md:text-sm font-medium text-gray-500 mt-2">
                      <span>3 questions</span>
                      <span>20 questions</span>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({ ...formData, difficulty: level })}
                          className={`px-4 py-3 md:py-4 rounded-xl border-2 font-semibold transition-all duration-300 hover:scale-105 ${
                            formData.difficulty === level
                              ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-purple-50 text-blue-700 shadow-lg'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {level === 'Easy' && '😊 Easy'}
                          {level === 'Medium' && '🎯 Medium'}
                          {level === 'Hard' && '🔥 Hard'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Limit */}
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      Time Limit: <span className="text-purple-600 text-lg md:text-xl">{formData.timeLimit} minutes</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="5"
                      value={formData.timeLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, timeLimit: parseInt(e.target.value) })
                      }
                      className="w-full h-3 bg-gray-300 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-xl [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-xl [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:appearance-none"
                    />
                    <div className="flex justify-between text-xs md:text-sm font-medium text-gray-500 mt-2">
                      <span>⚡ 5 min</span>
                      <span>🕐 60 min</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 md:px-8 py-4 md:py-5 bg-gradient-primary text-white rounded-2xl font-bold text-base md:text-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 transform btn-modern shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                        <span>Generating Quiz...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Brain className="h-6 w-6" />
                        <span>Generate Quiz 🚀</span>
                      </span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quiz Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 card-hover animate-fadeInUp" style={{ animationDelay: '100ms' }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Your Stats
              </h3>
              {recentAttempts.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Quizzes</span>
                    <span className="font-bold text-lg">{recentAttempts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg Score</span>
                    <span className="font-bold text-lg text-green-600">
                      {(
                        recentAttempts.reduce((acc, a) => acc + a.percentage, 0) /
                        recentAttempts.length
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No quizzes taken yet</p>
              )}
            </div>

            {/* Recent Attempts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Recent Quizzes
              </h3>
              {recentAttempts.length > 0 ? (
                <div className="space-y-3">
                  {recentAttempts.slice(0, 3).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-sm line-clamp-1">
                          {attempt.quiz.title}
                        </p>
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{attempt.quiz.questionType}</span>
                        <span className="font-medium text-green-600">
                          {attempt.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent quizzes</p>
              )}
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
              <h3 className="text-lg font-semibold mb-3 text-purple-900">Features</h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>AI-generated questions from your PDFs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Instant scoring and feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>PDF references for learning</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Timed quiz challenges</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
