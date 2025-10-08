"use client";

import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with PDF.js and DOMMatrix
const PdfViewerWithChat = dynamic(() => import('@/components/pdf-viewer-with-chat'), { 
	ssr: false,
	loading: () => (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
				<p className="text-slate-600">Loading PDF viewer...</p>
			</div>
		</div>
	)
});

interface PDFChunk {
	content: string;
	pageNumber: number;
	chunkIndex: number;
}

export default function PdfViewerWithChatWrapper({
	pdfChunks,
	fileName,
	pdfId,
}: {
	pdfChunks: PDFChunk[];
	fileName: string;
	pdfId?: string;
}) {
	return <PdfViewerWithChat pdfChunks={pdfChunks} fileName={fileName} pdfId={pdfId} />;
}
