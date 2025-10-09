import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import PerformanceCharts from '@/components/PerformanceCharts';
import AttemptsListClient from '@/components/AttemptsListClient';

export default async function ProgressPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      quizAttempts: {
        include: {
          quiz: { include: { pdf: true } },
          answers: { include: { question: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: 20,
      },
      progress: true,
      pdfs: true,
    },
  });

  if (!user) {
    redirect('/sign-in');
  }

  const attempts = user.quizAttempts ?? [];
  const totalAttempts = attempts.length;
  const averagePercentage =
    totalAttempts === 0
      ? 0
      : Math.round((attempts.reduce((s, a) => s + (a.percentage || 0), 0) / totalAttempts) * 10) / 10;

  // Aggregate per-PDF stats
  const perPdf: Record<string, { title: string; count: number; avg: number }> = {};
  for (const a of attempts) {
    const pdf = a.quiz?.pdf;
    if (!pdf) continue;
    if (!perPdf[pdf.id]) perPdf[pdf.id] = { title: pdf.title, count: 0, avg: 0 };
    perPdf[pdf.id].count += 1;
    perPdf[pdf.id].avg += a.percentage || 0;
  }
  Object.keys(perPdf).forEach((k) => {
    perPdf[k].avg = Math.round((perPdf[k].avg / perPdf[k].count) * 10) / 10;
  });

  const totalPdfs = user.pdfs?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-6">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6 md:mb-8 animate-fadeIn">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1 sm:mb-2">
            Progress Dashboard
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">Track your learning journey</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 mb-4 sm:mb-6 md:mb-8 animate-fadeInUp">
          <div className="group relative bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg sm:rounded-xl shadow-xl p-3 sm:p-4 md:p-5 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105">
            <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/10 rounded-full -mr-6 sm:-mr-8 md:-mr-10 -mt-6 sm:-mt-8 md:-mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <div className="bg-white/20 p-1 sm:p-1.5 rounded-lg">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-[10px] sm:text-xs font-semibold text-white/90 uppercase tracking-wide">Total Attempts</h3>
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-0.5 sm:mb-1">{totalAttempts}</p>
              <p className="text-[10px] sm:text-xs text-white/80">Quiz attempts</p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg sm:rounded-xl shadow-xl p-3 sm:p-4 md:p-5 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105">
            <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/10 rounded-full -mr-6 sm:-mr-8 md:-mr-10 -mt-6 sm:-mt-8 md:-mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <div className="bg-white/20 p-1 sm:p-1.5 rounded-lg">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-[10px] sm:text-xs font-semibold text-white/90 uppercase tracking-wide">Average Score</h3>
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-0.5 sm:mb-1">{averagePercentage}%</p>
              <p className="text-[10px] sm:text-xs text-white/80">Performance</p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-pink-500 to-pink-700 rounded-lg sm:rounded-xl shadow-xl p-3 sm:p-4 md:p-5 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 col-span-2 md:col-span-1">
            <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/10 rounded-full -mr-6 sm:-mr-8 md:-mr-10 -mt-6 sm:-mt-8 md:-mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <div className="bg-white/20 p-1 sm:p-1.5 rounded-lg">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-[10px] sm:text-xs font-semibold text-white/90 uppercase tracking-wide">PDFs Tracked</h3>
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-0.5 sm:mb-1">{totalPdfs}</p>
              <p className="text-[10px] sm:text-xs text-white/80">Materials</p>
            </div>
          </div>
        </div>

        {/* Performance Charts - Always show */}
        <PerformanceCharts attempts={attempts} averagePercentage={averagePercentage} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-2 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Recent Attempts</h2>
              </div>

              <AttemptsListClient attempts={attempts as any} />
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl sm:rounded-2xl shadow-lg border border-green-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-green-500 to-green-700 p-2 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Strengths & Weaknesses</h2>
              </div>
              {user.progress && user.progress.length > 0 ? (
                <div className="space-y-2.5 sm:space-y-3">
                  {user.progress.map((p) => (
                    <div key={p.id} className="bg-white/80 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 border border-green-100 hover:border-green-300 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{p.subject} • {p.topic}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">Last: {formatDate(p.lastActivity)}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs sm:text-sm font-bold text-green-600">Avg: {p.averageScore?.toFixed(1) ?? 'N/A'}%</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">Quizzes: {p.totalQuizzes}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
                  <p className="text-xs sm:text-sm text-gray-600">No progress tracking data yet.</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Complete more quizzes to see your strengths!</p>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-3 sm:space-y-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl shadow-lg border border-indigo-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Per-PDF Progress</h3>
              </div>
              {Object.keys(perPdf).length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                  <p className="text-xs sm:text-sm text-gray-600">No PDF-linked attempts yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(perPdf).map(([pdfId, s]) => (
                    <div key={pdfId} className="bg-white/80 backdrop-blur-sm rounded-lg p-2.5 border border-indigo-100 hover:border-indigo-300 transition-colors">
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <div className="text-xs sm:text-sm font-semibold text-gray-800 truncate flex-1 min-w-0">{s.title}</div>
                        <div className="text-xs sm:text-sm font-bold text-indigo-600 flex-shrink-0">{s.avg}%</div>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${s.avg}%` }} 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl sm:rounded-2xl shadow-lg border border-orange-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-br from-orange-500 to-pink-600 p-2 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Quick Links</h3>
              </div>
              <div className="space-y-2">
                <Link href="/pdfs" className="flex items-center gap-2 p-2.5 bg-white/80 backdrop-blur-sm rounded-lg border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all group">
                  <span className="text-xl">📚</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-orange-600">My PDFs</span>
                </Link>
                <Link href="/quiz" className="flex items-center gap-2 p-2.5 bg-white/80 backdrop-blur-sm rounded-lg border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all group">
                  <span className="text-xl">🎯</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-orange-600">Generate Quiz</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
