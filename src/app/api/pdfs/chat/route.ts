import { NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/gemini';
import { extractPDFText, chunkPDFText, generateTextEmbedding, cosineSimilarity } from '@/lib/pdf-processor';
import path from 'path';
import fs from 'fs';
import { writeFile, unlink } from 'fs/promises';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, fileName } = body;

    if (!question || !fileName) {
      return NextResponse.json({ answer: 'Invalid request' }, { status: 400 });
    }

    // Look up the PDF in the database to get Cloudinary URL
    const pdfRecord = await prisma.pDF.findFirst({
      where: { fileName }
    });

    if (!pdfRecord) {
      return NextResponse.json({ answer: 'PDF not found in database' }, { status: 404 });
    }

    // Verify it's a valid Cloudinary URL
    if (!pdfRecord.filePath.startsWith('http://') && !pdfRecord.filePath.startsWith('https://')) {
      return NextResponse.json({ answer: 'Invalid PDF URL. Please re-upload this file.' }, { status: 400 });
    }

    // Download PDF from Cloudinary to a temp file for processing
    const response = await fetch(pdfRecord.filePath);
    if (!response.ok) {
      throw new Error('Failed to fetch PDF from Cloudinary');
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create temp file for processing
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const filePath = path.join(tempDir, `chat-${Date.now()}-${fileName}`);
    await writeFile(filePath, buffer);

    // Load PDF text and chunks server-side (so we can compute embeddings & exact citation)
    const metadata = await extractPDFText(filePath);
    
    // Clean up temp file after processing
    await unlink(filePath);
    const pages = metadata.text.split(/\f|\n\s*Page\s+\d+\s*\n/gi);
    const chunks = chunkPDFText(metadata.text, 1200);

    // Build vocabulary and embeddings
    const vocabulary = Array.from(new Set(metadata.text.toLowerCase().split(/\W+/).filter(w => w.length > 2))).slice(0, 1000);
    const queryEmbedding = generateTextEmbedding(question, vocabulary);

    const scored = chunks.map((c, idx) => {
      const emb = generateTextEmbedding(c.content, vocabulary);
      const score = cosineSimilarity(queryEmbedding, emb);
      return { chunk: c, score, index: idx };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3);
    const selected = top[0]?.chunk;

    // Determine a short quote and line number within the page for the selected chunk
    let citation = null;
    if (selected) {
      const pageIndex = selected.pageNumber - 1;
      const pageText = pages[pageIndex] || '';
      // Choose a quote: first 200 chars of chunk content
      const quote = selected.content.substring(0, 200).replace(/\s+/g, ' ').trim();
      // Find approximate character index of the quote within the page text
      const charIndex = pageText.indexOf(selected.content) >= 0 ? pageText.indexOf(selected.content) : pageText.indexOf(quote) ;
      const before = charIndex >= 0 ? pageText.substring(0, charIndex) : '';
      const lineNumber = before ? before.split('\n').length : 1;
      citation = { pageNumber: selected.pageNumber, lineNumber, quote };
    }

    // Provide the top chunks as context to the model
    const context = top.map(t => t.chunk.content).join('\n\n');
    const answer = await generateChatResponse(question, context, top.map(t => ({ content: t.chunk.content, pageNumber: t.chunk.pageNumber })));

    return NextResponse.json({ answer, citation });
  } catch (err: any) {
    console.error('chat route error:', err);
    const fallback = 'Sorry — the AI assistant is temporarily unavailable. Please try again later.';
    return NextResponse.json({ answer: fallback, error: err?.message || String(err), citation: null }, { status: 200 });
  }
}
