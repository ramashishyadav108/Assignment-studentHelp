"use client";

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, List, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';

interface PDFViewerProps {
  pdfUrl: string;
  fileName: string;
  onPageChange?: (page: number) => void;
}

interface OutlineItem {
  title: string;
  pageNumber: number;
  items?: OutlineItem[];
}

// Small inline component: shows page counter and lets the user click to edit.
function PageInput({ currentPage, numPages, onGoTo }: { currentPage: number; numPages: number; onGoTo: (p: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentPage));
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep value in sync when currentPage changes externally
  useEffect(() => {
    if (!editing) setValue(String(currentPage));
  }, [currentPage, editing]);

  const commit = () => {
    const n = parseInt(value, 10);
    if (!isNaN(n)) {
      onGoTo(n);
    } else {
      // reset to current page
      setValue(String(currentPage));
    }
    setEditing(false);
  };

  return (
    <div className="px-2 py-0.5 bg-gray-100 rounded-md text-xs font-medium text-gray-700">
      {!editing ? (
        <button
          onClick={() => {
            setEditing(true);
            // focus next tick
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="min-w-[48px] text-center"
          aria-label="Current page; click to edit"
        >
          {currentPage} / {numPages}
        </button>
      ) : (
        <input
          ref={inputRef}
          className="w-16 text-center bg-transparent outline-none text-xs"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit();
            } else if (e.key === 'Escape') {
              setValue(String(currentPage));
              setEditing(false);
            }
          }}
        />
      )}
    </div>
  );
}

export default function PDFViewer({ pdfUrl, fileName, onPageChange }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  // Mobile: 55% zoom (0.55), Desktop: 115% zoom (1.15)
  const [scale, setScale] = useState<number>(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 0.55 : 1.15
  );
  const [showTopics, setShowTopics] = useState<boolean>(true);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State for dynamically loaded components
  const [pdfComponents, setPdfComponents] = useState<{
    Document: any;
    Page: any;
    pdfjs: any;
  } | null>(null);

  // Load react-pdf components only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-pdf').then((module) => {
        setPdfComponents({
          Document: module.Document,
          Page: module.Page,
          pdfjs: module.pdfjs,
        });

        // Configure PDF.js worker
        module.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${module.pdfjs.version}/build/pdf.worker.min.mjs`;
      });

      // Import CSS files dynamically
      // @ts-ignore - CSS imports work at runtime
      import('react-pdf/dist/Page/AnnotationLayer.css');
      // @ts-ignore - CSS imports work at runtime
      import('react-pdf/dist/Page/TextLayer.css');
    }
  }, []);

  // Handle responsive zoom on window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setScale(isMobile ? 0.55 : 1.15);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notify parent component when page changes
  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  async function onDocumentLoadSuccess({ numPages }: any) {
    setNumPages(numPages);

    // Try to extract outline/table of contents
    if (!pdfComponents) return;

    try {
      const loadingTask = pdfComponents.pdfjs.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const pdfOutline = await pdf.getOutline();

      if (pdfOutline && pdfOutline.length > 0) {
        const processOutline = async (items: any[]): Promise<OutlineItem[]> => {
          const processed: OutlineItem[] = [];
          for (const item of items) {
            let pageNum = 1;
            if (item.dest) {
              try {
                const dest = typeof item.dest === 'string' ? await pdf.getDestination(item.dest) : item.dest;
                if (dest) {
                  const pageRef = await pdf.getPageIndex(dest[0]);
                  pageNum = pageRef + 1;
                }
              } catch (e) {
                console.warn('Error getting page number for outline item:', e);
              }
            }

            const outlineItem: OutlineItem = {
              title: item.title,
              pageNumber: pageNum,
            };

            if (item.items && item.items.length > 0) {
              outlineItem.items = await processOutline(item.items);
            }

            processed.push(outlineItem);
          }
          return processed;
        };

        const processedOutline = await processOutline(pdfOutline);
        setOutline(processedOutline);
      }
    } catch (error) {
      console.error('Error loading PDF outline:', error);
    }
  }

  const scrollToPage = (pageNum: number) => {
    const pageElement = pageRefs.current[pageNum];
    if (pageElement && scrollContainerRef.current) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    setCurrentPage(page);
    scrollToPage(page);
  };

  // Track current page based on scroll position
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    // Find which page is currently most visible
    let maxVisibility = 0;
    let mostVisiblePage = 1;

    for (let i = 1; i <= numPages; i++) {
      const pageElement = pageRefs.current[i];
      if (!pageElement) continue;

      const rect = pageElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Calculate visible portion of the page
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      if (visibleHeight > maxVisibility) {
        maxVisibility = visibleHeight;
        mostVisiblePage = i;
      }
    }

    setCurrentPage(mostVisiblePage);
  };

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(2.0, prev + 0.15));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.4, prev - 0.15));
  };

  const resetZoom = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    setScale(isMobile ? 0.55 : 1.0);
  };

  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    link.click();
  };

  const renderOutlineItem = (item: OutlineItem, index: number, parentKey = ''): React.ReactElement => {
    const itemKey = `${parentKey}-${index}`;
    const hasChildren = item.items && item.items.length > 0;
    const isExpanded = expandedItems.has(itemKey);

    return (
      <div key={itemKey} className="outline-item">
        <div className="flex items-start gap-1">
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(itemKey)}
              className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0 mt-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-3.5 h-3.5 text-gray-600" />
              )}
            </button>
          )}
          <button
            onClick={() => scrollToPage(item.pageNumber)}
            className={`flex-1 text-left px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-blue-50 hover:text-blue-700 ${
              !hasChildren ? 'ml-5' : ''
            }`}
            title={`Go to page ${item.pageNumber}`}
          >
            <div className="font-medium text-gray-700 hover:text-blue-700 leading-snug">
              {item.title}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Page {item.pageNumber}</div>
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 border-l-2 border-gray-200 pl-2">
            {item.items!.map((child, idx) => renderOutlineItem(child, idx, itemKey))}
          </div>
        )}
      </div>
    );
  };

  // Don't render if react-pdf is not loaded (SSR protection)
  if (!pdfComponents) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-sm">Initializing PDF viewer...</p>
        </div>
      </div>
    );
  }

  const { Document, Page } = pdfComponents;

  return (
    <div className="flex h-full">
      {/* Topics/Outline Sidebar - Hidden on mobile */}
      <div className={`hidden md:block flex-shrink-0 border-r border-gray-200 bg-white transition-all duration-300 overflow-y-auto ${showTopics ? 'w-64' : 'w-0'}`}>
        {showTopics && (
          <div className="p-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {outline.length > 0 ? 'Table of Contents' : 'Pages'}
            </h3>
            <div className="space-y-1">
              {outline.length > 0 ? (
                outline.map((item, idx) => renderOutlineItem(item, idx))
              ) : (
                // Fallback to page list if no outline
                Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => scrollToPage(page)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-gray-100 text-gray-700"
                  >
                    Page {page}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main PDF Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Ultra Compact PDF Toolbar (centered) */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-2 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-4">
              {/* Toggle Topics - Hide on mobile */}
              <button
                onClick={() => setShowTopics(!showTopics)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors hidden md:block"
                aria-label="Toggle outline"
                title={showTopics ? 'Hide outline' : 'Show outline'}
              >
                <List className="w-3.5 h-3.5" />
              </button>

              {/* Zoom Controls + Page Counter */}
              <div className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial justify-between sm:justify-center">
                <div className="flex items-center gap-0.5 bg-white/0">
                  <button
                    onClick={zoomOut}
                    disabled={scale <= 0.4}
                    className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>

                  <button
                    onClick={resetZoom}
                    className="px-1.5 py-0.5 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-[10px] sm:text-xs font-medium min-w-[42px] sm:min-w-[48px]"
                    aria-label="Current zoom"
                    title="Click to reset zoom"
                  >
                    {Math.round(scale * 100)}%
                  </button>

                  <button
                    onClick={zoomIn}
                    disabled={scale >= 2.0}
                    className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>

                {/* Page counter placed next to zoom controls (click to edit) */}
                {numPages > 0 && (
                  <div className="flex items-center">
                    <PageInput
                      currentPage={currentPage}
                      numPages={numPages}
                      onGoTo={(p) => {
                        const page = Math.max(1, Math.min(numPages, Math.floor(p || 1)));
                        setCurrentPage(page);
                        scrollToPage(page);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PDF Document with Continuous Scroll - All Pages */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-auto bg-gray-100 relative"
          onScroll={handleScroll}
        >
          {/* Removed floating page indicator; page counter is shown in the toolbar next to zoom controls */}

          <div className="flex flex-col items-center py-4 gap-4">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-6">
                  <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 text-sm">Loading PDF...</p>
                  </div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-6">
                  <div className="text-center space-y-2">
                    <p className="text-red-600 font-semibold text-sm">Failed to load PDF</p>
                    <p className="text-gray-600 text-xs">Please try refreshing the page</p>
                  </div>
                </div>
              }
            >
              {Array.from({ length: numPages }, (_, index) => index + 1).map((page) => (
                <div
                  key={page}
                  ref={(el) => {
                    pageRefs.current[page] = el;
                  }}
                  className="mb-4"
                >
                  <Page
                    pageNumber={page}
                    scale={scale}
                    className="shadow-lg"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              ))}
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
}
