"use client";

import { useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface Answer {
  id: string;
  isCorrect: boolean;
  userAnswer: string;
  question: {
    questionText: string;
    correctAnswer: string;
  };
}

interface QuizAttempt {
  id: string;
  quizId: string;
  percentage: number | null;
  score: number | null;
  totalScore: number | null;
  completedAt: Date;
  quiz?: {
    title: string;
    questionType: string;
    totalQuestions: number;
    pdf?: {
      id: string;
      title: string;
    };
  };
  answers: Answer[];
}

interface AttemptsListClientProps {
  attempts: QuizAttempt[];
}

export default function AttemptsListClient({ attempts }: AttemptsListClientProps) {
  const [showAll, setShowAll] = useState(false);
  const [searchPdf, setSearchPdf] = useState<string>('');

  // Get unique PDFs
  const uniquePdfs = Array.from(
    new Set(
      attempts
        .map(a => a.quiz?.pdf)
        .filter(pdf => pdf !== undefined && pdf !== null)
        .map(pdf => JSON.stringify({ id: pdf!.id, title: pdf!.title }))
    )
  ).map(str => JSON.parse(str));

  // Filter attempts by selected PDF
  const filteredAttempts = searchPdf
    ? attempts.filter(a => a.quiz?.pdf?.id === searchPdf)
    : attempts;

  const displayedAttempts = showAll ? filteredAttempts : filteredAttempts.slice(0, 3);

  const AttemptCard = ({ a }: { a: QuizAttempt }) => (
    <div className="group bg-gradient-to-br from-gray-50 to-purple-50/30 border-2 border-gray-200 hover:border-purple-300 rounded-xl p-5 transition-all duration-300 hover:shadow-lg">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 flex-wrap">
            {a.quiz?.pdf && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium truncate">
                {a.quiz.pdf.title}
              </span>
            )}
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
              {a.quiz?.questionType}
            </span>
            <span className="text-gray-400">{a.quiz?.totalQuestions} Qs</span>
          </div>
          <h3 className="font-bold text-gray-900 mt-1 group-hover:text-purple-600 transition-colors">{a.quiz?.title}</h3>
          <div className="text-xs text-gray-500 mt-1">📅 {formatDate(a.completedAt)}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-2xl font-bold ${
            (a.percentage || 0) >= 90 ? 'text-green-600' : 
            (a.percentage || 0) >= 75 ? 'text-blue-600' : 
            (a.percentage || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {a.percentage?.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 mt-1">{a.score?.toFixed(1)} / {a.totalScore?.toFixed(1)}</div>
          <Link 
            href={`/quiz/${a.quizId}/results/${a.id}`} 
            className="inline-block mt-2 px-3 py-1 text-xs font-medium text-purple-600 hover:text-white hover:bg-purple-600 border border-purple-300 rounded-lg transition-all"
          >
            View Details
          </Link>
        </div>
      </div>

      <details className="mt-4 group/details">
        <summary className="cursor-pointer text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
          <span>Show answers</span>
          <svg className="w-4 h-4 transform transition-transform group-open/details:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="mt-3 space-y-2">
          {a.answers.map((ans) => (
            <div key={ans.id} className={`bg-white border-2 rounded-lg p-3 ${ans.isCorrect ? 'border-green-200' : 'border-red-200'}`}>
              <div className="text-sm font-medium text-gray-800">{ans.question.questionText}</div>
              <div className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Your answer: </span>
                <span className={`font-semibold ${ans.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {ans.userAnswer} {ans.isCorrect ? '✓' : '✗'}
                </span>
              </div>
              {!ans.isCorrect && (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Correct answer: </span>
                  <span className="text-green-600 font-semibold">{ans.question.correctAnswer}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );

  if (attempts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">No quiz attempts found yet</p>
        <p className="text-sm text-gray-500 mt-1">Take a quiz to see your progress here</p>
        <Link 
          href="/quiz" 
          className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
        >
          Start Quiz
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search/Filter by PDF */}
      {uniquePdfs.length > 1 && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200/50">
          <Search className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <select
            value={searchPdf}
            onChange={(e) => setSearchPdf(e.target.value)}
            className="flex-1 px-4 py-2 bg-white border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 text-sm font-medium text-gray-700"
          >
            <option value="">All PDFs ({attempts.length} attempts)</option>
            {uniquePdfs.map((pdf) => (
              <option key={pdf.id} value={pdf.id}>
                {pdf.title} ({attempts.filter(a => a.quiz?.pdf?.id === pdf.id).length} attempts)
              </option>
            ))}
          </select>
          {searchPdf && (
            <button
              onClick={() => setSearchPdf('')}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      {searchPdf && (
        <div className="text-sm text-gray-600">
          Showing <span className="font-bold text-purple-600">{filteredAttempts.length}</span> attempt{filteredAttempts.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Attempts List */}
      <div className="space-y-4">
        {displayedAttempts.map((a) => (
          <AttemptCard key={a.id} a={a} />
        ))}
      </div>

      {/* View More / View Less Button */}
      {filteredAttempts.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-2 border-purple-200 rounded-xl text-center font-semibold text-purple-700 transition-all flex items-center justify-center gap-2 group"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-5 h-5" />
              <span>View Less</span>
              <ChevronUp className="w-5 h-5" />
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              <span>View More Attempts ({filteredAttempts.length - 3} more)</span>
              <ChevronDown className="w-5 h-5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
