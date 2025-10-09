"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, X, List } from 'lucide-react';
import YouTubeRecommender from './YouTubeRecommender';
import TypingDots from './ui/TypingDots';
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
  // Default to open (page should show PDF left + chat right immediately)
  const [isOpen, setIsOpen] = useState(true);
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  // Store topics extracted from all pages during PDF parsing
  const [pageTopics, setPageTopics] = useState<{ [page: number]: string[] }>({});

  const dividerRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history when component opens. We load history to populate the sidebar
  // but we intentionally DO NOT auto-open the most recent chat — we want a new chat
  // to be the default when the panel opens.
  useEffect(() => {
    if (isOpen && chats.length === 0 && !loadingHistory) {
      loadChatHistory();
      // Also start a fresh chat session by default
      startNewChat();
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
        // Set the list of chats in the history sidebar but DO NOT auto-select any chat.
        // The UI will default to a new chat session when the panel opens.
        setChats(pdfChats);
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
    // Insert an inline placeholder assistant message so UI shows processing inside the chat
    let placeholderId = `ph-${Date.now()}`;
    setMessages((m) => [...m, { id: placeholderId, role: 'assistant', text: 'Processing...' }]);

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

        // Replace placeholder with real assistant response
        setMessages((m) => m.map(msg => msg.id === placeholderId ? { id: data.message?.id, role: 'assistant', text: answerText, createdAt: data.message?.createdAt } : msg));

        // Update or create chat session
        if (!activeChatId && data.chatId) {
          setActiveChatId(data.chatId);
          // Reload chat history to get the new chat
          setTimeout(() => loadChatHistory(), 500);
        }
      } else {
        setMessages((m) => m.map(msg => msg.id === placeholderId ? { id: undefined, role: 'assistant', text: 'Sorry — I could not process your request.' } : msg));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((m) => m.map(msg => msg.id === placeholderId ? { id: undefined, role: 'assistant', text: 'Sorry, there was an error processing your request.' } : msg));
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

  // Handler for showing recommendations based on current page
  // Extracts important points from page and recommends one video per point
  const handleShowRecommendations = () => {
    console.log('🎬 Starting recommendations for page', currentPage);
    
    // Use pre-extracted topics from PDF parsing
    const topics = pageTopics[currentPage] || [];
    
    if (topics.length === 0) {
      console.log('⚠️ No topics found for page', currentPage);
      alert(`No topics available for page ${currentPage}. Topics are extracted when the PDF is loaded.`);
      return;
    }

    console.log('🔑 Using', topics.length, 'pre-extracted topics:', topics);
    
    // Set topics - each will get one video recommendation (highest views)
    setPdfTopics(topics);
    setShowRecommendations(true);
  };

  // Handler for manual search
  const handleManualSearch = () => {
    if (manualSearchQuery.trim()) {
      setPdfTopics([manualSearchQuery.trim()]);
      setShowRecommendations(true);
      setManualSearchQuery('');
    }
  };

  return (
    <div className="relative h-[calc(100vh-80px)] bg-white">
        
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
            className="fixed right-2 sm:right-6 bottom-20 sm:bottom-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
            title="Open Assistant"
          >
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

  {/* Mobile: Stack vertically (55% PDF, 45% Chat), Desktop: Side by side */}
  <div className={`flex ${isOpen ? 'flex-col md:flex-row md:items-center' : 'flex-col'} h-full`}> 
    {/* PDF Viewer pane (boxed) - Increased width */}
    <div ref={leftRef} className={`relative transition-all duration-300 p-2 sm:p-3 md:p-4 ${isOpen ? 'h-1/2 md:h-full md:w-[60%] lg:w-[65%]' : 'w-full h-full'}`}>
      <div className="h-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        {/* Header for PDF box */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-medium truncate">{fileName}</div>
          <a href={pdfUrl} download={fileName} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Download</a>
        </div>

        {/* Scrollable PDF content */}
        <div className="flex-1 overflow-auto relative">
          <PDFViewer 
            pdfUrl={pdfUrl} 
            fileName={fileName}
            onPageChange={(page) => setCurrentPage(page)}
            onTopicsExtracted={(topics) => {
              console.log('📚 Received topics from PDF parsing:', Object.keys(topics).length, 'pages');
              setPageTopics(topics);
            }}
          />
          
          {/* YouTube Recommendations Button - Inside PDF Box, positioned at bottom with spacing */}
          {!showRecommendations && (
            <div className="absolute left-2 sm:left-4 bottom-4 sm:bottom-6 z-40 flex flex-col-reverse gap-2 max-w-[calc(100%-1rem)] sm:max-w-[calc(100%-2rem)]">
              {/* Manual Search Input - Shows at bottom */}
              <div className="flex gap-1 bg-white rounded-full shadow-lg p-1 border-2 border-purple-300">
                <input
                  type="text"
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  placeholder="Search videos..."
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-full flex-1 min-w-0 outline-none"
                />
                <button
                  onClick={handleManualSearch}
                  disabled={!manualSearchQuery.trim()}
                  className="px-2 sm:px-3 py-1.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full hover:shadow-md transition-all text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Search YouTube videos"
                >
                  Search
                </button>
              </div>
              
              {/* Recommendations Button - Shows above search */}
              <button
                onClick={handleShowRecommendations}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-xs sm:text-sm font-semibold"
                title="Get video recommendations for topics on this page"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] sm:text-xs opacity-90">Recommend for</span>
                  <span className="font-bold">Page {currentPage}</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Chat panel + divider when open (boxed) - Decreased width, increased height */}
    {isOpen && (
      <>
        <div
          ref={dividerRef}
          onMouseDown={startDrag}
          className="hidden md:block w-1 bg-transparent cursor-col-resize"
          aria-hidden
        />

        <div ref={rightRef} className="transition-all duration-300 p-2 sm:p-3 md:p-4 flex flex-col h-1/2 md:h-auto md:w-[40%] lg:w-[35%] md:self-center" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <div className="flex-1 bg-white shadow-2xl rounded-2xl border-2 border-slate-200 overflow-hidden flex flex-col min-h-0">
            {/* Chat Header (green theme) - Match outer chatbot */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 sm:p-3 md:p-4 shadow-lg flex-shrink-0">
              <div className="flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 md:p-2.5 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm md:text-base font-bold text-white truncate">
                      PDF Assistant 📄
                    </h2>
                    <p className="text-[10px] sm:text-xs text-green-100 hidden sm:block truncate">{pdfTopics.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
                  <button
                    onClick={startNewChat}
                    aria-label="New chat"
                    className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-white/20 hover:bg-white/30 rounded-md sm:rounded-lg transition-all duration-200 flex items-center gap-0.5 sm:gap-1 md:gap-1.5 text-white text-[10px] sm:text-xs font-semibold"
                    title="Start new conversation"
                  >
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                    <span className="hidden sm:inline">New</span>
                  </button>
                  <button
                    onClick={() => setHistoryOpen(h => !h)}
                    aria-label={historyOpen ? 'Hide history' : 'Show history'}
                    className={`p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg transition-all duration-200 ${
                      historyOpen ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
                    }`}
                    title={historyOpen ? 'Hide history' : 'Show history'}
                  >
                    <List className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close chat"
                    className="p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg hover:bg-white/20 transition-all duration-200"
                    title="Close chat"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages container with custom scrollbar - Match outer chatbot */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-5 space-y-2 sm:space-y-3 relative min-h-0 bg-gradient-to-b from-slate-50 to-white">
              {/* Blur overlay for chat area only when history is open */}
              {historyOpen && (
                <div 
                  className="absolute inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
                  onClick={() => setHistoryOpen(false)}
                />
              )}
              
              {/* Left history slider inside chat panel */}
              <div className={`absolute left-0 top-0 bottom-0 w-64 sm:w-72 lg:w-80 bg-white/95 backdrop-blur-xl border-r-2 border-slate-200 shadow-2xl overflow-y-auto transition-all duration-300 z-50 ${historyOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="sticky top-0 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm z-10 p-4 border-b-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-green-600" />
                      <h4 className="font-bold text-sm text-slate-800">Chat History</h4>
                    </div>
                    <button
                      onClick={() => setHistoryOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-green-100 transition-colors"
                      title="Close history"
                    >
                      <X className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  {loadingHistory ? (
                    <div className="text-center py-8 text-sm text-slate-500">
                      <div className="animate-spin w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                      <p className="font-medium">Loading chats...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chats.map((chat) => (
                        <button 
                          key={chat.id} 
                          onClick={() => {
                            loadChat(chat);
                            setHistoryOpen(false);
                          }} 
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all hover:shadow-lg ${
                            activeChatId === chat.id 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-md' 
                              : 'bg-white border-slate-200 hover:border-green-300 hover:bg-green-50/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold truncate text-slate-800 mb-1">{chat.title}</div>
                              <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                {chat.messages.length > 0 
                                  ? chat.messages[chat.messages.length - 1].text.slice(0, 60) + (chat.messages[chat.messages.length - 1].text.length > 60 ? '...' : '')
                                  : 'No messages'}
                              </div>
                            </div>
                            {activeChatId === chat.id && (
                              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                            <div className="text-xs font-medium text-slate-400">
                              📅 {new Date(chat.updatedAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-300">•</div>
                            <div className="text-xs font-medium text-green-600">
                              {chat.messages.length} msg{chat.messages.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </button>
                      ))}
                      {chats.length === 0 && (
                        <div className="text-center py-12 px-4 text-sm text-slate-400">
                          <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-xl opacity-20"></div>
                            <MessageSquare className="w-14 h-14 mx-auto text-slate-300 relative" />
                          </div>
                          <p className="font-semibold text-slate-600 mb-1">No conversations yet</p>
                          <p className="text-xs">Start chatting to build your history! 💬</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4 animate-fadeIn px-4">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                      <div className="relative bg-gradient-to-br from-green-100 to-emerald-100 p-6 rounded-full">
                        <MessageSquare className="w-16 h-16 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-700 font-semibold text-lg mb-2">👋 Hello! I'm your PDF Assistant</p>
                      <p className="text-slate-500 text-sm max-w-sm mx-auto">Ask me anything about this PDF - I'm here to help you learn and understand! ✨</p>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}
                >
                  <div className={`max-w-[85%] sm:max-w-[75%] ${
                    m.role === 'user' 
                      ? 'ml-auto' 
                      : 'mr-auto'
                  }`}>
                    <div className={`p-3 sm:p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 ${
                      m.role === 'user' 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-br-sm' 
                        : 'bg-white text-slate-800 rounded-bl-sm border-2 border-slate-100'
                    }`}>
                      {/* Typing placeholder support */}
                      {((m.id && String(m.id).startsWith('ph-')) || m.text === 'Processing...') ? (
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                      )}
                      {m.createdAt && (
                        <p className={`text-xs mt-2 flex items-center gap-1 ${m.role === 'user' ? 'text-green-100' : 'text-slate-400'}`}>
                          <span>🕐</span>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area with modern design - Match outer chatbot */}
            <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-r from-slate-50 to-green-50/30 border-t-2 border-slate-200 flex-shrink-0">
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 sm:focus:ring-4 focus:ring-green-100 transition-all duration-200 text-xs sm:text-sm resize-none shadow-md hover:shadow-lg disabled:opacity-50 overflow-y-auto"
                    placeholder="💬 Ask about the PDF..."
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !loading) {
                        e.preventDefault();
                        sendQuery();
                      }
                    }}
                    style={{ minHeight: '40px', maxHeight: '80px' }}
                  />
                  <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 text-slate-300">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <button 
                  onClick={sendQuery} 
                  className="px-3 sm:px-5 md:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-1 sm:gap-2 min-w-[50px] sm:min-w-[60px]" 
                  disabled={loading || !query.trim()}
                  title="Send message"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline text-xs sm:text-sm">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline text-xs sm:text-sm">Send</span>
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
