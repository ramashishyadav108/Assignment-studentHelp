"use client";

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Search, X } from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';

interface PDF {
  id: string;
  title: string;
  fileName: string;
  subject: string | null;
  totalPages: number;
  fileSize: number;
  uploadedAt: Date;
}

interface PDFListClientProps {
  pdfs: PDF[];
}

export default function PDFListClient({ pdfs }: PDFListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPDFs = pdfs.filter(pdf => 
    pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pdf.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pdf.subject && pdf.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search PDFs by title, filename, or subject..."
          className="block w-full pl-9 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-white border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all duration-200 placeholder:text-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="text-xs sm:text-sm text-gray-600">
          Found <span className="font-bold text-purple-600">{filteredPDFs.length}</span> PDF{filteredPDFs.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* PDF Grid */}
      {filteredPDFs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {filteredPDFs.map((pdf, index) => (
            <Link
              key={pdf.id}
              href={`/pdfs/${pdf.id}`}
              style={{ animationDelay: `${index * 50}ms` }}
              className="group bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-2.5 sm:p-3 md:p-4 hover:shadow-2xl transition-all duration-300 overflow-hidden card-hover animate-fadeInUp relative"
            >
              {/* Decorative gradient background */}
              <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100/50 to-blue-100/50 rounded-full -mr-8 sm:-mr-10 -mt-8 sm:-mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                {/* Icon & Badge */}
                <div className="flex items-start justify-between mb-2 sm:mb-2.5 md:mb-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
                  </div>
                  {pdf.subject && (
                    <span className="inline-block px-1.5 sm:px-2 py-0.5 bg-gradient-primary text-white text-[8px] sm:text-[10px] font-semibold rounded-full shadow-md">
                      {pdf.subject}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-xs sm:text-sm md:text-base text-gray-900 mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {pdf.title}
                </h3>

                {/* Stats */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-2.5 text-[10px] sm:text-xs flex-wrap">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-500"></div>
                    <span className="text-gray-600 font-medium">{pdf.totalPages} pages</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600 font-medium">{formatFileSize(pdf.fileSize)}</span>
                  </div>
                </div>

                {/* Date */}
                <div className="pt-2 sm:pt-2.5 border-t border-gray-100">
                  <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">
                    📅 {formatDate(pdf.uploadedAt)}
                  </p>
                </div>

                {/* Hover effect indicator - hidden on mobile */}
                <div className="mt-2 sm:mt-2.5 hidden sm:flex items-center gap-1.5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-semibold">View</span>
                  <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300">
          <Search className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2">No PDFs found</h3>
          <p className="text-xs sm:text-sm text-gray-600">
            Try adjusting your search query
          </p>
        </div>
      )}
    </div>
  );
}
