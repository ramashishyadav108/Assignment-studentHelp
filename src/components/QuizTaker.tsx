'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import {
  BookOpen,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
} from 'lucide-react';

type Question = {
  id: string;
  type: string;
  questionText: string;
  options: any;
  order: number;
  points: number;
};

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  questionType: string;
  totalQuestions: number;
  questions: Question[];
  pdf: {
    id: string;
    title: string;
  } | null;
};

type Props = {
  quiz: Quiz;
  userId: string;
};

export default function QuizTaker({ quiz, userId }: Props) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Show warning at 2 minutes
  useEffect(() => {
    if (timeLeft === 120 && !showWarning) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (answer: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Check if all questions are answered
    const unansweredCount = quiz.questions.filter(
      (q) => !answers[q.id] || answers[q.id].trim() === ''
    ).length;

    if (unansweredCount > 0 && timeLeft > 0) {
      const confirmed = confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz.id,
          answers,
          timeTaken: 600 - timeLeft,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quiz');
      }

      // Redirect to results page
      router.push(`/quiz/${quiz.id}/results/${data.attemptId}`);
    } catch (error: any) {
      alert(error.message);
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).filter(
    (key) => answers[key] && answers[key].trim() !== ''
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">

  {/* Sticky timer bar below the main Header */}
  <div className="sticky top-20 z-20 bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-end">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeLeft < 120
                  ? 'bg-red-100 text-red-700'
                  : timeLeft < 300
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      {showWarning && (
        <div className="bg-red-600 text-white px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Only 2 minutes remaining!</span>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {answeredCount} / {quiz.questions.length} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  {currentQuestion.type}
                </span>
                <span className="text-sm text-gray-500">{currentQuestion.points} points</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentQuestion.questionText}
              </h2>
            </div>
          </div>

          {/* Answer Input */}
          <div className="space-y-4">
            {currentQuestion.type === 'MCQ' && currentQuestion.options ? (
              <div className="space-y-3">
                {(Array.isArray(currentQuestion.options)
                  ? currentQuestion.options
                  : []
                ).map((option: string, index: number) => (
                  <label
                    key={index}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      answers[currentQuestion.id] === option
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      className="mt-1"
                    />
                    <span className="flex-1">{option}</span>
                  </label>
                ))}
              </div>
            ) : currentQuestion.type === 'SAQ' ? (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            ) : (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your detailed answer here..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex gap-3">
            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4" />
                    Submit Quiz
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Question Navigator</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {quiz.questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-purple-600 text-white'
                    : answers[question.id] && answers[question.id].trim() !== ''
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
