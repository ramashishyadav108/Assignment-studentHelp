"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, X, List } from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  messages: Array<{ id: string; role: 'user' | 'assistant'; text: string; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
}

export default function GeneralChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ id?: string; role: 'user' | 'assistant'; text: string; createdAt?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        setChats(data.chats);
        
        // If there are existing chats, load the most recent one
        if (data.chats.length > 0) {
          const mostRecent = data.chats[0];
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
          message: q 
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

  return (
    <>
      {/* Blur Background Overlay when history is open */}
      {isOpen && historyOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setHistoryOpen(false)}
        />
      )}

      <div className="relative">
        {/* Floating compact bubble when closed */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed right-6 bottom-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-2xl flex items-center justify-center hover:shadow-green-500/50 hover:scale-110 transition-all duration-300 group"
            title="Open AI Assistant"
          >
            <MessageSquare className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
          </button>
        )}

        {/* Chat panel when open */}
        {isOpen && (
          <div className="fixed right-4 bottom-4 w-full sm:w-[500px] lg:w-[580px] flex flex-col bg-white shadow-2xl z-50 rounded-2xl border-2 border-slate-200 overflow-hidden" 
               style={{ height: 'calc(100vh - 120px)', maxHeight: '700px' }}>
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 shadow-lg flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      AI Assistant 🤖
                    </h2>
                    <p className="text-xs text-green-100">Always here to help you</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={startNewChat}
                    aria-label="New chat"
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-white text-xs font-semibold"
                    title="Start new conversation"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">New</span>
                  </button>

                  <button
                    onClick={() => setHistoryOpen(h => !h)}
                    aria-label={historyOpen ? 'Hide history' : 'Show history'}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      historyOpen ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
                    }`}
                    title={historyOpen ? 'Hide history' : 'Show history'}
                  >
                    <List className="w-4 h-4 text-white" />
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close chat"
                    className="p-2 rounded-lg hover:bg-white/20 transition-all duration-200"
                    title="Close chat"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

          {/* Messages container with custom scrollbar */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 relative min-h-0 bg-gradient-to-b from-slate-50 to-white">
            {/* Left history slider inside chat panel - Now with blur effect */}
            <div className={`absolute left-0 top-0 bottom-0 w-72 sm:w-80 bg-white/95 backdrop-blur-xl border-r-2 border-slate-200 shadow-2xl overflow-y-auto transition-all duration-300 z-50 ${historyOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
                    <p className="text-slate-700 font-semibold text-lg mb-2">👋 Hello! I'm your AI Assistant</p>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">Ask me anything - I'm here to help you learn, explore, and discover! ✨</p>
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
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

            {loading && (
              <div className="flex justify-start animate-slideInLeft">
                <div className="bg-white p-4 rounded-2xl rounded-bl-sm shadow-lg border border-slate-200">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area with modern design */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-green-50/30 border-t-2 border-slate-200 flex-shrink-0">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 text-sm resize-none shadow-md hover:shadow-lg"
                  placeholder="💬 Type your message..."
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !loading) {
                      e.preventDefault();
                      sendQuery();
                    }
                  }}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <div className="absolute right-3 bottom-3 text-slate-300">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <button 
                onClick={sendQuery} 
                className="px-5 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-w-[60px]" 
                disabled={loading || !query.trim()}
                title="Send message"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline text-sm">Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm">Send</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center font-medium">
              💡 Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      )}

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

        @keyframes slideIn {
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

        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.4s ease-out;
        }

        /* Custom scrollbar */
        :global(.overflow-y-auto)::-webkit-scrollbar {
          width: 6px;
        }

        :global(.overflow-y-auto)::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        :global(.overflow-y-auto)::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #059669);
          border-radius: 10px;
        }

        :global(.overflow-y-auto)::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #047857);
        }
      `}</style>
      </div>
    </>
  );
}
