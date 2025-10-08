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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <div className="mb-8 md:mb-12 animate-fadeIn">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Progress Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600">Track your learning journey</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12 animate-fadeInUp">
          <div className="group relative bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-purple-200 p-6 md:p-8 overflow-hidden transition-all duration-300 card-hover">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">Total Attempts</h3>
              <p className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">{totalAttempts}</p>
              <p className="text-xs md:text-sm text-gray-500 mt-2">Quiz attempts completed</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-200 p-6 md:p-8 overflow-hidden transition-all duration-300 card-hover">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">Average Score</h3>
              <p className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{averagePercentage}%</p>
              <p className="text-xs md:text-sm text-gray-500 mt-2">Overall performance</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-pink-200 p-6 md:p-8 overflow-hidden transition-all duration-300 sm:col-span-2 lg:col-span-1 card-hover">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">PDFs Tracked</h3>
              <p className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent">{totalPdfs}</p>
              <p className="text-xs md:text-sm text-gray-500 mt-2">Learning materials</p>
            </div>
          </div>
        </div>

        {/* Performance Charts - Always show */}
        <PerformanceCharts attempts={attempts} averagePercentage={averagePercentage} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Attempts</h2>
              </div>

              <AttemptsListClient attempts={attempts as any} />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Strengths & Weaknesses</h2>
              {user.progress && user.progress.length > 0 ? (
                <div className="space-y-4">
                  {user.progress.map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{p.subject} • {p.topic}</div>
                        <div className="text-xs text-gray-500">Last activity: {formatDate(p.lastActivity)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">Avg: {p.averageScore?.toFixed(1) ?? 'N/A'}</div>
                        <div className="text-xs text-gray-500">Quizzes: {p.totalQuizzes}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No progress tracking data yet.</p>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-2">Per-PDF Progress</h3>
              {Object.keys(perPdf).length === 0 ? (
                <p className="text-gray-600">No PDF-linked attempts yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(perPdf).map(([pdfId, s]) => (
                    <div key={pdfId}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium truncate">{s.title}</div>
                        <div className="text-sm text-gray-500">{s.avg}%</div>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div style={{ width: `${s.avg}%` }} className="h-2 bg-gradient-to-r from-purple-600 to-blue-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pdfs" className="text-blue-600 hover:underline">My PDFs</Link></li>
                <li><Link href="/quiz" className="text-blue-600 hover:underline">Generate/Take Quiz</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
