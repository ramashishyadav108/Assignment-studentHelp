'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Youtube, ExternalLink, X, Lightbulb } from 'lucide-react';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  description: string;
  viewCount?: number;
  topic?: string;
}

interface YouTubeRecommenderProps {
  topics: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function YouTubeRecommender({ topics, isOpen, onClose }: YouTubeRecommenderProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    if (isOpen && topics.length > 0) {
      fetchRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchRecommendations = async () => {
    console.log('Fetching recommendations for topics:', topics);
    setLoading(true);
    setVideos([]); // Clear previous videos
    
    try {
      const response = await fetch('/api/youtube/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('YouTube API error response:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received videos:', data.videos?.length || 0);
      
      if (data.videos && data.videos.length > 0) {
        setVideos(data.videos);
      } else {
        console.warn('No videos returned from API');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 3));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(videos.length - 3, prev + 3));
  };

  const visibleVideos = videos.slice(currentIndex, currentIndex + 3);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex + 3 < videos.length;

  if (!isOpen) return null;

  return (
    <>
      {/* Recommender Panel - Opens upward with better spacing */}
      <div className="fixed bottom-16 sm:bottom-20 left-2 right-2 sm:left-6 sm:right-auto z-50 sm:max-w-[800px] max-h-[calc(100vh-180px)] sm:max-h-[500px]">
        <div
          className="bg-white border-2 border-purple-500 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
          style={{ letterSpacing: '0', wordSpacing: 'normal' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-lg flex-shrink-0">
                <Youtube className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-purple-600 truncate" style={{ letterSpacing: '0', wordSpacing: 'normal' }}>
                  Video Recommendations
                </h3>
                <p className="text-xs text-gray-600 truncate" style={{ letterSpacing: '0', wordSpacing: 'normal' }}>
                  {videos.length > 0 ? `${videos.length} video${videos.length !== 1 ? 's' : ''} for ${topics.length} topic${topics.length !== 1 ? 's' : ''}` : 'Loading...'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close recommendations"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8 px-6">
              <div className="text-center space-y-2">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-600">Finding videos...</p>
              </div>
            </div>
          )}

          {/* No Videos State */}
          {!loading && videos.length === 0 && (
            <div className="flex items-center justify-center py-12 px-6">
              <div className="text-center space-y-3">
                <Lightbulb className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-base font-semibold text-gray-700 mb-1">No videos found</p>
                  <p className="text-sm text-gray-500">Try searching directly on YouTube for:</p>
                  <p className="text-sm text-purple-600 font-medium mt-2">
                    {topics.slice(0, 2).join(' • ')}
                  </p>
                </div>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topics[0] || 'educational tutorial')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Youtube className="w-4 h-4" />
                  Search on YouTube
                </a>
              </div>
            </div>
          )}

          {/* Video Carousel - Scrollable content */}
          {!loading && videos.length > 0 && (
            <div className="p-2 sm:p-4 overflow-y-auto flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Previous Button */}
                <button
                  onClick={handlePrevious}
                  disabled={!canGoPrevious}
                  className={`p-1.5 sm:p-2 rounded-full shadow-md transition-all flex-shrink-0 ${
                    canGoPrevious
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  aria-label="Previous videos"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>

                {/* Videos Grid - Responsive: 1 on mobile, 3 on desktop */}
                <div className="flex gap-2 sm:gap-3 flex-1 min-w-0 scrollbar-hide">
                  {visibleVideos.slice(0, 1).map((video) => (
                    <div
                      key={video.id}
                      className="w-full sm:hidden bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex-shrink-0"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="relative">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center opacity-90">
                            <Youtube className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        {(video as any).topic && (
                          <div className="mb-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[9px] font-semibold inline-block truncate max-w-full">
                            📌 {(video as any).topic}
                          </div>
                        )}
                        <h4 className="font-semibold text-xs line-clamp-2 text-gray-900">
                          {video.title}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[10px] text-gray-600 truncate">{video.channelTitle}</p>
                          {video.viewCount && (
                            <p className="text-[9px] text-green-600 font-semibold">
                              👁️ {video.viewCount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {visibleVideos.map((video) => (
                    <div
                      key={video.id}
                      className="hidden sm:block flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="relative">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center opacity-90">
                            <Youtube className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        {video.viewCount && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 text-white rounded text-[9px] font-semibold">
                            👁️ {video.viewCount.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        {(video as any).topic && (
                          <div className="mb-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[9px] font-semibold inline-block truncate max-w-full">
                            📌 {(video as any).topic}
                          </div>
                        )}
                        <h4 className="font-semibold text-xs line-clamp-2 text-gray-900">
                          {video.title}
                        </h4>
                        <p className="text-[10px] text-gray-600 truncate mt-1">{video.channelTitle}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className={`p-1.5 sm:p-2 rounded-full shadow-md transition-all flex-shrink-0 ${
                    canGoNext
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  aria-label="Next videos"
                >
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Video Counter */}
              <div className="text-center mt-2 sm:mt-3">
                <p className="text-xs text-gray-600">
                  <span className="sm:hidden">{currentIndex + 1} of {videos.length}</span>
                  <span className="hidden sm:inline">{currentIndex + 1}-{Math.min(currentIndex + 3, videos.length)} of {videos.length}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-[60]"
            onClick={() => setSelectedVideo(null)}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h4 className="font-semibold text-lg text-gray-900 flex-1 pr-4">
                  {selectedVideo.title}
                </h4>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Youtube className="w-4 h-4" />
                    Open in YouTube
                  </a>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Video Player */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Video Info */}
              <div className="p-4 bg-gray-50">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Channel:</span> {selectedVideo.channelTitle}
                </p>
                <p className="text-sm text-gray-600 line-clamp-3">{selectedVideo.description}</p>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
