"use client";

import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity } from 'lucide-react';

interface AttemptData {
  id: string;
  percentage: number | null;
  completedAt: Date;
  quiz?: {
    title: string;
    questionType: string;
  };
}

interface PerformanceChartsProps {
  attempts: AttemptData[];
  averagePercentage: number;
}

export default function PerformanceCharts({ attempts, averagePercentage }: PerformanceChartsProps) {
  // Use sample data if no attempts exist
  const sampleData = [
    { id: '1', percentage: 65, completedAt: new Date() },
    { id: '2', percentage: 72, completedAt: new Date() },
    { id: '3', percentage: 68, completedAt: new Date() },
    { id: '4', percentage: 78, completedAt: new Date() },
    { id: '5', percentage: 82, completedAt: new Date() },
    { id: '6', percentage: 75, completedAt: new Date() },
    { id: '7', percentage: 85, completedAt: new Date() },
    { id: '8', percentage: 88, completedAt: new Date() },
    { id: '9', percentage: 90, completedAt: new Date() },
    { id: '10', percentage: 92, completedAt: new Date() },
  ];

  const displayAttempts = attempts.length > 0 ? attempts : sampleData;
  const displayAverage = attempts.length > 0 ? averagePercentage : 78.5;
  const isSampleData = attempts.length === 0;

  // Calculate trend
  const recentAttempts = displayAttempts.slice(0, 5);
  const olderAttempts = displayAttempts.slice(5, 10);
  const recentAvg = recentAttempts.length > 0 
    ? recentAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / recentAttempts.length 
    : 0;
  const olderAvg = olderAttempts.length > 0 
    ? olderAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / olderAttempts.length 
    : recentAvg;
  const trend = recentAvg - olderAvg;
  const isImproving = trend >= 0;

  // Group by score ranges
  const scoreRanges = {
    '90-100': 0,
    '75-89': 0,
    '60-74': 0,
    '0-59': 0,
  };

  displayAttempts.forEach((a) => {
    const score = a.percentage || 0;
    if (score >= 90) scoreRanges['90-100']++;
    else if (score >= 75) scoreRanges['75-89']++;
    else if (score >= 60) scoreRanges['60-74']++;
    else scoreRanges['0-59']++;
  });

  const maxCount = Math.max(...Object.values(scoreRanges), 1);

  // Last 10 attempts for line chart
  const chartData = displayAttempts.slice(0, 10).reverse();

  return (
    <div className="space-y-6 mb-8">
      {/* Sample Data Notice */}
      {isSampleData && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">📊 Sample Performance Data</p>
            <p className="text-xs text-gray-600 mt-0.5">Take your first quiz to see your actual performance!</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 card-hover">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Performance Trend
            </h3>
            <p className="text-sm text-gray-500 mt-1">Recent vs Previous</p>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
            isImproving ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {isImproving ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        </div>

        {/* Line Chart with Points */}
        <div className="relative h-64 mb-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50 rounded-xl p-4">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-400 pr-2">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          {/* Grid lines */}
          <div className="absolute left-12 right-4 top-0 bottom-8 flex flex-col justify-between">
            {[100, 75, 50, 25, 0].map((val) => (
              <div key={val} className="border-t border-gray-200"></div>
            ))}
          </div>

          {/* Chart area */}
          <div className="relative ml-12 mr-4 pb-8" style={{ height: 'calc(100% - 2rem)' }}>
            {/* SVG for lines */}
            <svg className="absolute inset-0 w-full h-full">
              {/* Draw connecting lines */}
              {chartData.map((attempt, index) => {
                if (index === chartData.length - 1) return null;
                const x1 = (index / (chartData.length - 1)) * 100;
                const y1 = 100 - (attempt.percentage || 0);
                const x2 = ((index + 1) / (chartData.length - 1)) * 100;
                const y2 = 100 - (chartData[index + 1].percentage || 0);
                return (
                  <line
                    key={`line-${attempt.id}`}
                    x1={`${x1}%`}
                    y1={`${y1}%`}
                    x2={`${x2}%`}
                    y2={`${y2}%`}
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    className="drop-shadow-lg"
                  />
                );
              })}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9333ea" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>

            {/* Data points */}
            {chartData.map((attempt, index) => {
              const x = (index / (chartData.length - 1)) * 100;
              const y = 100 - (attempt.percentage || 0);
              return (
                <div
                  key={attempt.id}
                  className="absolute group cursor-pointer z-10"
                  style={{ 
                    left: `${x}%`, 
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {/* Point */}
                  <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full border-3 border-white shadow-lg group-hover:scale-150 transition-transform duration-200"></div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl z-10 pointer-events-none">
                    <div className="font-bold">Test #{chartData.length - index}</div>
                    <div className="text-purple-300">{(attempt.percentage || 0).toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-12 right-4 flex justify-between text-xs text-gray-500 font-medium">
            {chartData.map((attempt, index) => (
              <span key={attempt.id} className="text-center">
                #{chartData.length - index}
              </span>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-sm px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
            <span className="text-gray-600 font-medium">Score Progress</span>
          </div>
          <div className="text-gray-500">
            <span className="font-semibold text-gray-700">{chartData.length}</span> Tests
          </div>
        </div>
      </div>

      {/* Score Distribution Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 card-hover">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Score Distribution
            </h3>
            <p className="text-sm text-gray-500 mt-1">Performance breakdown</p>
          </div>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="space-y-4">
          {Object.entries(scoreRanges).map(([range, count], index) => {
            const percentage = attempts.length > 0 ? (count / attempts.length) * 100 : 0;
            const colors = [
              'from-green-500 to-green-600',
              'from-blue-500 to-blue-600',
              'from-yellow-500 to-yellow-600',
              'from-red-500 to-red-600',
            ];
            
            return (
              <div key={range}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">{range}%</span>
                  <span className="text-sm text-gray-500">{count} quiz{count !== 1 ? 'zes' : ''}</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${colors[index]} flex items-center justify-end px-3 text-white text-xs font-bold transition-all duration-700`}
                    style={{ width: `${Math.max(percentage, count > 0 ? 10 : 0)}%` }}
                  >
                    {count > 0 && `${percentage.toFixed(0)}%`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Insights Card */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg border border-purple-200 p-6 lg:col-span-2">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-primary p-3 rounded-xl shadow-lg">
            <PieChart className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Performance Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
                <div className="text-sm text-gray-500 mb-1">Overall Average</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {displayAverage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {displayAverage >= 90 ? '🌟 Excellent!' : displayAverage >= 75 ? '✨ Great job!' : displayAverage >= 60 ? '👍 Good progress!' : '💪 Keep practicing!'}
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
                <div className="text-sm text-gray-500 mb-1">Best Score</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {displayAttempts.length > 0 ? Math.max(...displayAttempts.map(a => a.percentage || 0)).toFixed(1) : '0'}%
                </div>
                <div className="text-xs text-gray-500 mt-1">🏆 Personal record</div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-pink-100">
                <div className="text-sm text-gray-500 mb-1">Recent Form</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                  {recentAvg.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {isImproving ? '📈 Improving!' : '📊 Steady'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
