"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, MessageSquare, Sparkles, X, List } from 'lucide-react';
import YouTubeRecommender from './YouTubeRecommender';

interface PDFChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
}

export default function PdfPageClient({
  pdfChunks,
  fileName,
}: {
  pdfChunks: PDFChunk[];
  fileName: string;
}) {
  // Chat open state: when false show compact bubble, when true show full chat panel
  const [isOpen, setIsOpen] = useState(false);
  // Sidebar for previous chats inside the chat panel
  const [historyOpen, setHistoryOpen] = useState(true);
  // Sessions: array of message arrays for previous chats
  const [sessions, setSessions] = useState<Array<Array<{ role: 'user' | 'assistant'; text: string }>>>([]);
  const [activeSessionIndex, setActiveSessionIndex] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [loading, setLoading] = useState(false);
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
      // Extract topics from PDF chunks
      const topics: string[] = [];

      // Get topics from first few chunks
      const chunksToAnalyze = pdfChunks.slice(0, 5);
      chunksToAnalyze.forEach(chunk => {
        // Extract sentences that might be topics
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

      // Limit to 5 unique topics
      const uniqueTopics = [...new Set(topics)].slice(0, 5);
      setPdfTopics(uniqueTopics.length > 0 ? uniqueTopics : [fileName]);
    }
  }, [pdfChunks, fileName]);

  // When opening chat, if no active session, create a new one from current messages
  useEffect(() => {
    if (isOpen && activeSessionIndex === null) {
      // start a new session using current messages if any
      if (messages.length > 0) {
        setSessions(s => [...s, messages]);
        setActiveSessionIndex(sessions.length);
      } else {
        setSessions(s => [...s, []]);
        setActiveSessionIndex(sessions.length);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

    // Only send the question and fileName; server will compute chunks & citation
    const res = await fetch('/api/pdfs/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, fileName }),
    });

    const data = await res.json();
    const answerText = data?.answer || 'Sorry — the assistant did not return an answer.';
    const fullText = data?.error ? `${answerText} (detail: ${data.error})` : answerText;

    // If API returned a citation, do not add a separate citation block. Append only the assistant answer
    // but still scroll/highlight the cited chunk in the document view.
    if (data?.citation) {
      const c = data.citation as { pageNumber: number; lineNumber?: number; quote?: string };
      setMessages((m) => [...m, { role: 'assistant', text: answerText }]);
      // also push to active session
      if (activeSessionIndex !== null) {
        setSessions(s => {
          const copy = s.map(arr => [...arr]);
          copy[activeSessionIndex!].push({ role: 'assistant', text: answerText });
          return copy;
        });
      }

      // Scroll to and highlight the cited chunk
      setTimeout(() => {
        const selector = `[data-page="${c.pageNumber}"]`;
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          try {
            el.animate([
              { boxShadow: '0 0 0 0 rgba(59,130,246,0.0)' },
              { boxShadow: '0 0 0 10px rgba(59,130,246,0.12)' },
              { boxShadow: '0 0 0 0 rgba(59,130,246,0.0)' },
            ], { duration: 1600 });
          } catch (e) {
            // ignore animation errors in older browsers
          }
        }
      }, 200);
    } else {
      setMessages((m) => [...m, { role: 'assistant', text: fullText }]);
      if (activeSessionIndex !== null) {
        setSessions(s => {
          const copy = s.map(arr => [...arr]);
          copy[activeSessionIndex!].push({ role: 'assistant', text: fullText });
          return copy;
        });
      }
    }

    setLoading(false);
  }

  return (
    <div className="relative min-h-screen bg-white">
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
          className="fixed right-6 bottom-6 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center"
          title="Open Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

  <div className={`flex h-full`}> 
        {/* Document pane */}
        <div ref={leftRef} className={`overflow-auto ${isOpen ? 'w-7/12' : 'w-full'} backdrop-blur-xl bg-white/70 border-r border-slate-200/50 shadow-2xl transition-all duration-300`}>
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200/50 p-2">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-md bg-gray-100">
                <FileText className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Document</h2>
                <p className="text-xs text-slate-500 mt-0.5">{fileName}</p>
              </div>
            </div>
          </div>

          <div className="p-2 space-y-4">
            {pdfChunks.map((c, idx) => (
              <div
                key={idx}
                data-page={c.pageNumber}
                className="group animate-fadeIn opacity-0"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s forwards` }}
              >
                <div className="relative pl-6 border-l-2 border-blue-200 group-hover:border-blue-400 transition-colors duration-300">
                  <div className="absolute -left-2 top-1 w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform duration-300"></div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold rounded-full shadow-md">
                      Page {c.pageNumber}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-sm">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
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

            <div className="w-5/12 flex flex-col backdrop-blur-xl bg-white/70">
              <div className="backdrop-blur-xl bg-white/80 border-b border-slate-200/50 p-6 shadow-lg">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg animate-pulse">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          AI Assistant
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Ask anything about your document</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setHistoryOpen(h => !h)}
                        aria-label={historyOpen ? 'Hide history' : 'Show history'}
                        className="p-2 rounded-md hover:bg-slate-100"
                        title={historyOpen ? 'Hide history' : 'Show history'}
                      >
                        <List className="w-4 h-4 text-slate-600" />
                      </button>

                      <button
                        onClick={() => setIsOpen(false)}
                        aria-label="Close chat"
                        className="p-2 rounded-md hover:bg-slate-100"
                        title="Close chat"
                      >
                        <X className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-4 relative">
                {/* Left history slider inside chat panel */}
                <div className={`absolute left-0 top-0 bottom-0 w-72 bg-white/95 border-r border-slate-200 p-4 overflow-y-auto transition-transform duration-300 ${historyOpen ? 'translate-x-0' : '-translate-x-72'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Chats</h4>
                    <button onClick={() => setHistoryOpen(h => !h)} className="text-sm text-slate-500">{historyOpen ? 'Hide' : 'Show'}</button>
                  </div>
                  <div className="space-y-3">
                    {sessions.map((s, idx) => (
                      <button key={idx} onClick={() => { setActiveSessionIndex(idx); setMessages(s); }} className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50">
                        <div className="text-sm font-medium">Session {idx + 1}</div>
                        <div className="text-xs text-slate-500 truncate">{s.length ? s[s.length - 1].text.slice(0, 80) : 'Empty'}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* When history is hidden, show a slim tab to re-open it */}
                {!historyOpen && (
                  <button
                    onClick={() => setHistoryOpen(true)}
                    aria-label="Open chat history"
                    className="absolute left-0 top-1/3 -translate-x-6 w-6 h-20 bg-white border border-slate-200 rounded-r-md flex items-center justify-center shadow-sm hover:bg-slate-50 z-50"
                    title="Open chat history"
                  >
                    <div className="w-px h-8 bg-slate-300" />
                  </button>
                )}

                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4 animate-fadeIn">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                        <MessageSquare className="w-16 h-16 text-slate-300 relative" />
                      </div>
                      <p className="text-slate-400 text-sm">Start a conversation by asking a question</p>
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}
                    style={{ animation: `slideIn${m.role === 'user' ? 'Right' : 'Left'} 0.4s ease-out` }}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${
                      m.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm' : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start animate-slideInLeft">
                    <div className="bg-white p-4 rounded-2xl rounded-bl-sm shadow-lg border border-slate-200">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-6 backdrop-blur-xl bg-white/80 border-t border-slate-200/50">
                <div className="flex gap-3 max-w-4xl mx-auto">
                  <div className="flex-1 relative group">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full px-5 py-4 pr-12 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 text-sm shadow-sm"
                      placeholder="Ask a question about the document..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading) sendQuery();
                      }}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                  </div>
                  <button onClick={sendQuery} className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">Thinking</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
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