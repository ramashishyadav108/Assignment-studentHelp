"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, X, List } from 'lucide-react';
import YouTubeRecommender from './YouTubeRecommender';
import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with PDF.js and DOMMatrix
const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600 text-sm">Loading PDF viewer...</p>
      </div>
    </div>
  )
});

interface PDFChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Array<{ id: string; role: 'user' | 'assistant'; text: string; pdfId?: string | null; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
}

export default function PdfViewerWithChat({
  pdfChunks,
  fileName,
  pdfId,
}: {
  pdfChunks: PDFChunk[];
  fileName: string;
  pdfId?: string;
}) {
  // Chat open state: when false show compact bubble, when true show split screen
  const [isOpen, setIsOpen] = useState(false);
  // Sidebar for previous chats inside the chat panel
  const [historyOpen, setHistoryOpen] = useState(true);
  // Sessions: loaded from database
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ id?: string; role: 'user' | 'assistant'; text: string; createdAt?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // YouTube Recommender state
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [pdfTopics, setPdfTopics] = useState<string[]>([]);

  const dividerRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract topics from PDF content
  useEffect(() => {
    if (pdfChunks.length > 0) {
      const topics: string[] = [];
      const chunksToAnalyze = pdfChunks.slice(0, 5);
      chunksToAnalyze.forEach(chunk => {
        const sentences = chunk.content.split(/[.!?]\s+/);
        sentences.slice(0, 2).forEach(sentence => {
          if (sentence.length > 10 && sentence.length < 100) {
            // Normalize text: remove extra spaces and weird characters
            const normalized = sentence.trim().replace(/\s+/g, ' ').replace(/[^\w\s\-,]/g, '');
            if (normalized.length > 10) {
              topics.push(normalized);
            }
          }
        });
      });
      const uniqueTopics = [...new Set(topics)].slice(0, 5);
      setPdfTopics(uniqueTopics.length > 0 ? uniqueTopics : [fileName]);
    }
  }, [pdfChunks, fileName]);

  // Load chat history when component opens
  useEffect(() => {
    if (isOpen && chats.length === 0 && !loadingHistory) {
      loadChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function loadChatHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/chat/history');
      const data = await res.json();
      
      if (data.success && data.chats) {
        console.log('All chats:', data.chats);
        console.log('Current pdfId:', pdfId);
        
        // Filter chats for this PDF if pdfId is provided
        // A chat belongs to this PDF if ANY of its messages have this pdfId
        const pdfChats = pdfId 
          ? data.chats.filter((chat: any) => {
              const hasPdfMessages = chat.messages.some((msg: any) => msg.pdfId === pdfId);
              console.log(`Chat ${chat.id} (${chat.title}): has PDF messages =`, hasPdfMessages);
              return hasPdfMessages;
            })
          : data.chats;
        
        console.log('Filtered PDF chats:', pdfChats);
        setChats(pdfChats);
        
        // If there are existing chats, load the most recent one
        if (pdfChats.length > 0) {
          const mostRecent = pdfChats[0];
          setActiveChatId(mostRecent.id);
          setMessages(mostRecent.messages);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }

  const startDrag = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startLeftWidth = leftRef.current?.getBoundingClientRect().width || 400;

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      if (leftRef.current && rightRef.current) {
        const parentWidth = leftRef.current.parentElement!.getBoundingClientRect().width;
        let newLeft = startLeftWidth + dx;
        newLeft = Math.max(200, Math.min(parentWidth - 200, newLeft));
        leftRef.current.style.width = `${newLeft}px`;
      }
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  async function sendQuery() {
    if (!query.trim()) return;
    const q = query.trim();
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setQuery('');
    setLoading(true);

    try {
      // Call chat API endpoint that saves to database
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId: activeChatId,
          message: q,
          pdfId: pdfId
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        const answerText = data.message?.content || 'Sorry — I could not process your request.';
        
        // Update messages with the assistant's response
        setMessages((m) => [...m, { 
          id: data.message?.id,
          role: 'assistant', 
          text: answerText,
          createdAt: data.message?.createdAt
        }]);

        // Update or create chat session
        if (!activeChatId && data.chatId) {
          setActiveChatId(data.chatId);
          // Reload chat history to get the new chat
          setTimeout(() => loadChatHistory(), 500);
        }
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: 'Sorry — I could not process your request.' }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((m) => [...m, { role: 'assistant', text: 'Sorry, there was an error processing your request.' }]);
    }

    setLoading(false);
  }

  function startNewChat() {
    setActiveChatId(null);
    setMessages([]);
  }

  function loadChat(chat: ChatSession) {
    setActiveChatId(chat.id);
    setMessages(chat.messages);
  }

  const pdfUrl = `/api/pdfs/file/${encodeURIComponent(fileName)}`;

  return (
    <div className="relative h-screen bg-white">
        {/* YouTube Recommendations Floating Button */}
        {pdfTopics.length > 0 && !showRecommendations && (
          <button
            onClick={() => setShowRecommendations(true)}
            className="fixed left-6 bottom-6 z-40 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
            title="View video recommendations"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span className="font-medium hidden sm:inline">Recommendations</span>
          </button>
        )}

        {/* YouTube Recommender Component */}
        <YouTubeRecommender
          topics={pdfTopics}
          isOpen={showRecommendations}
          onClose={() => setShowRecommendations(false)}
        />

        {/* When closed, show floating compact bubble */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed right-6 bottom-6 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
            title="Open Assistant"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        )}

  <div className={`flex h-full`}> 
        {/* PDF Viewer pane */}
        <div ref={leftRef} className={`overflow-hidden ${isOpen ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
          <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
        </div>

        {/* Chat panel + divider when open */}
        {isOpen && (
          <>
            <div
              ref={dividerRef}
              onMouseDown={startDrag}
              className="w-1 bg-gradient-to-b from-blue-300 via-indigo-300 to-purple-300 cursor-col-resize hover:w-1.5 transition-all duration-200 relative group"
              aria-hidden
            >
              <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </div>

            <div ref={rightRef} className="w-1/2 backdrop-blur-xl bg-white/70 relative overflow-hidden" style={{ height: '100vh' }}>
              {/* Blur overlay when history is open - only covers chat area */}
              {historyOpen && (
                <div 
                  className="absolute inset-0 bg-black/30 backdrop-blur-sm z-40"
                  onClick={() => setHistoryOpen(false)}
                  aria-hidden="true"
                />
              )}

              {/* Fixed Header */}
              <div className="absolute top-0 left-0 right-0 backdrop-blur-xl bg-gradient-to-r from-white via-indigo-50/30 to-purple-50/30 border-b-2 border-indigo-200/50 p-3 shadow-lg z-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      PDF Assistant
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={startNewChat}
                      className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors duration-200 border border-indigo-200/50"
                      title="Start new chat"
                    >
                      New Chat
                    </button>
                    
                    <button
                      onClick={() => setHistoryOpen(h => !h)}
                      aria-label={historyOpen ? 'Hide history' : 'Show history'}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                      title={historyOpen ? 'Hide history' : 'Show history'}
                    >
                      <List className="w-4 h-4 text-slate-600" />
                    </button>

                    <button
                      onClick={() => setIsOpen(false)}
                      aria-label="Close chat"
                      className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                      title="Close chat"
                    >
                      <X className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* History sidebar with frosted glass effect */}
              <div className={`absolute left-0 bottom-0 w-80 bg-white/95 backdrop-blur-xl border-r-2 border-indigo-200/50 shadow-2xl overflow-y-auto transition-transform duration-300 ease-out z-50 ${historyOpen ? 'translate-x-0' : '-translate-x-80'}`} style={{ top: '60px' }}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-indigo-100">
                    <h4 className="font-bold text-base bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">PDF Chats</h4>
                    <button
                      onClick={() => setHistoryOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Close history"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <div className="inline-block w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <p className="text-sm text-slate-500 mt-3">Loading history...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chats.map((chat) => {
                        const isActive = activeChatId === chat.id;
                        return (
                          <button
                            key={chat.id}
                            onClick={() => {
                              loadChat(chat);
                              setHistoryOpen(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 group relative ${
                              isActive
                                ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-md'
                                : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-lg'
                            }`}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-r-full"></div>
                            )}
                            <div className="flex items-start gap-2">
                              <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate text-slate-800">{chat.title}</div>
                                <div className="text-xs text-slate-500 truncate mt-1">
                                  {chat.messages.length > 0 
                                    ? chat.messages[chat.messages.length - 1].text.slice(0, 60) + '...'
                                    : 'No messages'}
                                </div>
                                <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                                  <span>📅</span>
                                  {new Date(chat.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {chats.length === 0 && (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-sm font-medium text-slate-600">No chat history yet</p>
                          <p className="text-xs text-slate-400 mt-1">Start a conversation to see it here</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable Messages Area */}
              <div className="absolute top-0 left-0 right-0 bottom-0 overflow-y-auto" style={{ paddingTop: '64px', paddingBottom: '100px' }}>
                <div className="p-4 space-y-3">

                {messages.length === 0 && (
                  <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
                    <div className="text-center space-y-4 animate-fadeIn">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                        <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-xl">
                          <Sparkles className="w-10 h-10 text-indigo-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Welcome to PDF Assistant! 👋</h3>
                        <p className="text-sm text-slate-500">Ask questions about your PDF document</p>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}
                    style={{ animation: `slideIn${m.role === 'user' ? 'Right' : 'Left'} 0.4s ease-out` }}
                  >
                    <div className={`max-w-[85%] p-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 ${
                      m.role === 'user' 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-md' 
                        : 'bg-white text-slate-800 rounded-bl-md border-2 border-slate-100'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start animate-slideInLeft">
                    <div className="bg-white p-4 rounded-2xl rounded-bl-md shadow-lg border-2 border-slate-100">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Fixed Input Area at Bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-pink-50/50 backdrop-blur-xl border-t-2 border-indigo-200/50 shadow-2xl z-20">
                <div className="p-4">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 text-sm shadow-lg placeholder:text-slate-400"
                        placeholder="Ask about this PDF..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !loading) sendQuery();
                        }}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="absolute -top-7 right-2 text-xs text-slate-400">
                        Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-sm font-mono">Enter</kbd> to send
                      </div>
                    </div>
                    <button 
                      onClick={sendQuery} 
                      className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:inline text-sm">Thinking...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span className="hidden sm:inline text-sm">Send</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.4s ease-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
