import React from 'react';
import { extractPDFText, chunkPDFText, PDFChunk } from '@/lib/pdf-processor';
import PdfViewerWithChat from '@/components/pdf-viewer-with-chat';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { FileX, File, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

interface Params {
	params: { id: string };
}

// Client Component for error page
function ErrorPageClient({ id, files }: { id: string; files: string[] }) {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
				<div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
			</div>

			<div className="relative min-h-screen flex items-center justify-center p-6">
				<div className="max-w-3xl w-full animate-[fadeInUp_0.8s_ease-out]">
					{/* Main error card */}
					<div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
						<div className="flex items-start gap-6 mb-8">
							<div className="relative">
								<div className="absolute inset-0 bg-red-500/50 rounded-2xl blur-xl animate-pulse"></div>
								<div className="relative p-5 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-lg">
									<FileX className="w-10 h-10 text-white" />
								</div>
							</div>
							<div className="flex-1">
								<h2 className="text-3xl font-bold text-white mb-2">Document Not Found</h2>
								<p className="text-red-300 text-sm">
									Unable to locate document with ID: <span className="font-mono bg-white/10 px-2 py-1 rounded">{id}</span>
								</p>
							</div>
						</div>

						{/* Available documents section */}
						<div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
							<div className="flex items-center justify-between mb-5">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-blue-500/20 rounded-lg">
										<Sparkles className="w-5 h-5 text-blue-400" />
									</div>
									<div>
										<h3 className="text-white font-bold text-lg">Available Documents</h3>
										<p className="text-slate-400 text-xs mt-0.5">{files.length} files found</p>
									</div>
								</div>
							</div>

							<p className="text-slate-300 text-sm mb-5 leading-relaxed">
								Click on any document below to view it, or use the filename or prefix in your URL.
							</p>

							<div className="space-y-2 max-h-[400px] overflow-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-blue-400/30 hover:scrollbar-thumb-blue-400/50">
								{files.map((f: string, idx: number) => (
									<a
										key={f}
										href={`/pdf/${f.split('.')[0]}`}
										className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 border border-white/5 hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/20 animate-[slideIn_0.5s_ease-out_forwards] opacity-0"
										style={{ animationDelay: `${idx * 0.05}s` }}
									>
										<div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform">
											<File className="w-5 h-5 text-blue-400" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-slate-200 font-medium truncate group-hover:text-white transition-colors">
												{f}
											</p>
											<p className="text-slate-500 text-xs mt-0.5">Click to open document</p>
										</div>
										<div className="flex items-center gap-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
											<span className="text-sm font-medium">Open</span>
											<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
										</div>
									</a>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// Client Component for success header
function SuccessHeaderClient({ metadata, fileName }: { metadata: any; fileName: string }) {
	return (
		<header className="bg-white border-b border-slate-200/50">
			<div className="max-w-screen-2xl mx-auto px-4 py-3">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3 flex-1 min-w-0">
						{/* Document icon (smaller) */}
						<div className="p-2 rounded-md bg-gray-100">
							<File className="w-6 h-6 text-slate-800" />
						</div>
						
						{/* Document info (smaller) */}
						<div className="flex-1 min-w-0">
							<h1 className="text-xl md:text-2xl font-semibold text-slate-900 truncate mb-0.5">
								{metadata.title}
							</h1>
							<div className="flex items-center gap-3 flex-wrap mt-1">
								<div className="flex items-center gap-2 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full text-sm">
									<CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
									<span className="text-sm font-medium text-green-700">{metadata.totalPages} pages</span>
								</div>
								<div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
									<span className="font-mono text-xs truncate max-w-xs">{fileName}</span>
								</div>
							</div>
						</div>
					</div>
					
					{/* Status indicator + Take Quiz button */}
					<div className="hidden lg:flex items-center gap-3">
						<div className="px-4 py-2 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2 shadow-sm">
							<div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
							<span className="text-sm font-medium text-green-700">Document Ready</span>
						</div>
						
						<a href="/quiz" className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700">
							<span className="text-sm font-semibold">Take Quiz</span>
						</a>
					</div>
				</div>
			</div>
		</header>
	);
}

export default async function Page({ params }: Params) {
	const { id } = await Promise.resolve(params);

	// Look up PDF in database (only Cloudinary PDFs)
	let pdf = null;
	try {
		// Try to find by ID first
		pdf = await prisma.pDF.findUnique({ where: { id } });
		
		// Verify it's a Cloudinary PDF
		if (pdf && !pdf.filePath.startsWith('https://')) {
			pdf = null; // Ignore local file paths
		}
		
		// If not found, try to find by filename pattern (only Cloudinary PDFs)
		if (!pdf) {
			const allPdfs = await prisma.pDF.findMany({
				where: {
					filePath: {
						startsWith: 'https://',
					},
				},
			});
			pdf = allPdfs.find(p => p.fileName === id || p.fileName.startsWith(id) || p.fileName.includes(id));
		}
	} catch (err) {
		console.error('Database lookup failed:', err);
	}

	// If no PDF found, show error page with available PDFs (only Cloudinary)
	if (!pdf) {
		const allPdfs = await prisma.pDF.findMany({ 
			where: {
				filePath: {
					startsWith: 'https://',
				},
			},
			select: { fileName: true } 
		});
		const files = allPdfs.map(p => p.fileName);
		return <ErrorPageClient id={id} files={files} />;
	}

	// Verify PDF has a valid Cloudinary URL
	if (!pdf.filePath.startsWith('http://') && !pdf.filePath.startsWith('https://')) {
		const allPdfs = await prisma.pDF.findMany({ 
			where: {
				filePath: {
					startsWith: 'https://',
				},
			},
			select: { fileName: true } 
		});
		const files = allPdfs.map(p => p.fileName);
		return <ErrorPageClient id={id} files={files} />;
	}

	// Download PDF from Cloudinary to temp file for processing
	const response = await fetch(pdf.filePath);
	if (!response.ok) {
		throw new Error('Failed to fetch PDF from Cloudinary');
	}
	const arrayBuffer = await response.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	
	// Create temp file for processing
	const { writeFile, unlink } = await import('fs/promises');
	const fs = await import('fs');
	const tempDir = path.join(process.cwd(), 'temp');
	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir, { recursive: true });
	}
	const tempFilePath = path.join(tempDir, `page-${Date.now()}-${pdf.fileName}`);
	await writeFile(tempFilePath, buffer);

	// Extract metadata and chunks
	const metadata = await extractPDFText(tempFilePath);
	const chunks = chunkPDFText(metadata.text, 1200).map((c) => ({
		content: c.content,
		pageNumber: c.pageNumber,
		chunkIndex: c.chunkIndex,
	})) as PDFChunk[];

	// Clean up temp file
	await unlink(tempFilePath);

	return (
		<div className="min-h-screen bg-white">
			<SuccessHeaderClient metadata={metadata} fileName={pdf.fileName} />
			<PdfViewerWithChat pdfChunks={chunks} fileName={pdf.fileName} pdfId={pdf.id} />
		</div>
	);
}