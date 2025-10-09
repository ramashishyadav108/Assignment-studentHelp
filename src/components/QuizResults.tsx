'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import {
  BookOpen,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Award,
  TrendingUp,
  Home,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Youtube,
} from 'lucide-react';
import YouTubeRecommender from './YouTubeRecommender';

type Answer = {
  id: string;
  userAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  question: {
    id: string;
    type: string;
    questionText: string;
    options: any;
    correctAnswer: string;
    explanation: string | null;
    pageReference: number | null;
    points: number;
  };
};

type Attempt = {
  id: string;
  score: number;
  totalScore: number;
  percentage: number;
  timeTaken: number | null;
  completedAt: Date;
  quiz: {
    id: string;
    title: string;
    questionType: string;
    totalQuestions: number;
    pdf: {
      id: string;
      title: string;
      filePath: string;
    } | null;
  };
  answers: Answer[];
};

type Props = {
  attempt: Attempt;
};

export default function QuizResults({ attempt }: Props) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showRecommendations, setShowRecommendations] = useState(false);

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const gradeInfo = getGrade(attempt.percentage);
  const correctAnswers = attempt.answers.filter((a) => a.isCorrect).length;
  const unattemptedCount = attempt.answers.filter((a) => !a.userAnswer || a.userAnswer.trim() === '').length;

  // Get topics from wrong answers for YouTube recommendations
  const wrongAnswerTopics = attempt.answers
    .filter((a) => !a.isCorrect)
    .map((a) => {
      // Extract topic from question text or use question type
      const topic = a.question.questionText.split(/[?.]/)[0].trim();
      return topic.length > 100 ? a.question.type : topic;
    })
    .filter((topic, index, self) => self.indexOf(topic) === index) // Remove duplicates
    .slice(0, 5); // Limit to 5 topics

  console.log('Wrong answer topics:', wrongAnswerTopics);

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* YouTube Recommendations Floating Button */}
      {wrongAnswerTopics.length > 0 && !showRecommendations && (
        <button
          onClick={() => setShowRecommendations(true)}
          className="fixed left-3 sm:left-6 bottom-3 sm:bottom-6 z-40 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
          title="View video recommendations"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span className="font-medium text-xs sm:text-sm hidden sm:inline">Recommendations</span>
        </button>
      )}

      {/* YouTube Recommender Component */}
      <YouTubeRecommender
        topics={wrongAnswerTopics}
        isOpen={showRecommendations}
        onClose={() => setShowRecommendations(false)}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Results Header */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 text-white mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 line-clamp-2">{attempt.quiz.title}</h1>
              <p className="text-xs sm:text-sm md:text-base text-purple-100">
                {attempt.quiz.questionType} Quiz • {attempt.quiz.totalQuestions} Questions
              </p>
            </div>
            <Trophy className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-yellow-300 flex-shrink-0" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 md:p-4">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <Award className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="text-[10px] sm:text-xs md:text-sm font-medium">Score</span>
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold">
                {attempt.score.toFixed(1)} / {attempt.totalScore}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 md:p-4">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="text-[10px] sm:text-xs md:text-sm font-medium">Percentage</span>
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold">{attempt.percentage.toFixed(1)}%</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 md:p-4">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="text-[10px] sm:text-xs md:text-sm font-medium">Correct</span>
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold">
                {correctAnswers} / {attempt.quiz.totalQuestions}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 md:p-4">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="text-[10px] sm:text-xs md:text-sm font-medium">Time</span>
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold">{formatTime(attempt.timeTaken)}</p>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg ${gradeInfo.bg} flex-shrink-0`}>
              <span className={`text-2xl sm:text-3xl font-bold ${gradeInfo.color}`}>
                {gradeInfo.grade}
              </span>
            </div>
            <div className="flex-1 text-xs sm:text-sm">
              <p className="font-medium">
                {attempt.percentage >= 80
                  ? 'Excellent work! 🎉'
                  : attempt.percentage >= 60
                  ? 'Good job! Keep practicing! 👍'
                  : 'Keep learning and try again! 💪'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            href="/quiz"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700"
          >
            <RotateCcw className="h-4 w-4" />
            Take Another Quiz
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Link>
          {attempt.quiz.pdf && (
            <Link
              href={`/pdfs/${attempt.quiz.pdf.id}`}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              View PDF
            </Link>
          )}
        </div>

        {/* Questions Review */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Question Review</h2>

          {attempt.answers.map((answer, index) => {
            const isExpanded = expandedQuestions.has(answer.question.id);
            const isUnattempted = !answer.userAnswer || answer.userAnswer.trim() === '';

            return (
              <div
                key={answer.id}
                className={`bg-white rounded-lg shadow-sm border-2 ${
                  isUnattempted ? 'border-gray-200' : answer.isCorrect ? 'border-green-200' : 'border-red-200'
                }`}
              >
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => toggleQuestion(answer.question.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                          Question {index + 1}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          {answer.question.type}
                        </span>
                        {answer.question.pageReference && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Page {answer.question.pageReference}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {answer.question.questionText}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          answer.isCorrect
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {answer.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                        <span className="font-medium">
                          {answer.pointsEarned.toFixed(1)} / {answer.question.points}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
                      {/* User's Answer */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Your Answer:</p>
                        <div
                          className={`p-4 rounded-lg ${
                            isUnattempted ? 'bg-gray-50' : answer.isCorrect ? 'bg-green-50' : 'bg-red-50'
                          }`}
                        >
                          <p className="text-gray-900">{isUnattempted ? 'Unattempted' : answer.userAnswer}</p>
                        </div>
                      </div>

                      {/* Correct Answer - show only when user attempted and it's incorrect */}
                      {!isUnattempted && !answer.isCorrect && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Correct Answer:</p>
                          <div className="p-4 rounded-lg bg-green-50">
                            <p className="text-gray-900">{answer.question.correctAnswer}</p>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {answer.question.explanation && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Explanation:</p>
                          <div className="p-4 rounded-lg bg-blue-50">
                            <p className="text-gray-900">{answer.question.explanation}</p>
                          </div>
                        </div>
                      )}

                      {/* PDF Reference Link */}
                      {answer.question.pageReference && attempt.quiz.pdf && (
                        <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                          <FileText className="h-5 w-5 text-purple-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Learn more about this topic
                            </p>
                            <p className="text-xs text-gray-600">
                              {attempt.quiz.pdf.title} - Page {answer.question.pageReference}
                            </p>
                          </div>
                          <Link
                            href={`/pdfs/${attempt.quiz.pdf.id}?page=${answer.question.pageReference}`}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 text-sm font-medium"
                          >
                            View in PDF
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Summary */}
        <div className="mt-4 sm:mt-6 md:mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4">Performance Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <div className="p-2.5 sm:p-3 md:p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
                <span className="font-medium text-green-900 text-[10px] sm:text-xs md:text-sm">Correct</span>
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-green-600">
                {correctAnswers} ({((correctAnswers / attempt.quiz.totalQuestions) * 100).toFixed(0)}%)
              </p>
            </div>

            <div className="p-2.5 sm:p-3 md:p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0" />
                <span className="font-medium text-red-900 text-[10px] sm:text-xs md:text-sm">Incorrect</span>
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-red-600">
                {attempt.quiz.totalQuestions - correctAnswers - unattemptedCount} (
                {((((attempt.quiz.totalQuestions - correctAnswers - unattemptedCount) / attempt.quiz.totalQuestions) * 100)).toFixed(0)}
                %)
              </p>
            </div>

            <div className="p-2.5 sm:p-3 md:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <span className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 inline-block rounded-full bg-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-900 text-[10px] sm:text-xs md:text-sm">Unattempted</span>
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-700">
                {unattemptedCount} (
                {((unattemptedCount / attempt.quiz.totalQuestions) * 100).toFixed(0)}%)
              </p>
            </div>

            <div className="p-2.5 sm:p-3 md:p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600 flex-shrink-0" />
                <span className="font-medium text-purple-900 text-[10px] sm:text-xs md:text-sm">Points</span>
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-purple-600">
                {attempt.score.toFixed(1)} / {attempt.totalScore}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
