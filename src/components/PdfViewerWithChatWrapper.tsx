"use client";

import { useEffect, useState } from 'react';

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
	const [PdfViewerComponent, setPdfViewerComponent] = useState<any>(null);

	useEffect(() => {
		// Only import the component on the client side
		import('@/components/pdf-viewer-with-chat').then((mod) => {
			setPdfViewerComponent(() => mod.default);
		});
	}, []);

	if (!PdfViewerComponent) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
					<p className="text-slate-600">Loading PDF viewer...</p>
				</div>
			</div>
		);
	}

	return <PdfViewerComponent pdfChunks={pdfChunks} fileName={fileName} pdfId={pdfId} />;
}
