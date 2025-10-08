import { pdf } from 'pdf-parse';
import { readFile } from 'fs/promises';

export interface PDFMetadata {
  title: string;
  totalPages: number;
  text: string;
}

export async function extractPDFText(filePath: string): Promise<PDFMetadata> {
  const dataBuffer = await readFile(filePath);
  const data = await pdf(dataBuffer);

  return {
    title: (data.info as any)?.Title || 'Untitled',
    totalPages: data.total,
    text: data.text,
  };
}

export interface PDFChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
}

export function chunkPDFText(text: string, chunkSize: number = 1000): PDFChunk[] {
  const chunks: PDFChunk[] = [];
  
  // Split by pages first (looking for page break indicators)
  const pagePattern = /\f|\n\s*Page\s+\d+\s*\n/gi;
  const pages = text.split(pagePattern);

  pages.forEach((pageText, pageIndex) => {
    const sentences = pageText.match(/[^.!?]+[.!?]+/g) || [pageText];
    let currentChunk = '';
    let chunkIndex = 0;

    sentences.forEach((sentence) => {
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          pageNumber: pageIndex + 1,
          chunkIndex: chunkIndex++,
        });
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    });

    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        pageNumber: pageIndex + 1,
        chunkIndex: chunkIndex,
      });
    }
  });

  return chunks;
}

// Simple cosine similarity for vector search
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Simple text embedding using TF-IDF-like approach
export function generateTextEmbedding(text: string, vocabulary: string[] = []): number[] {
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const wordFreq = new Map<string, number>();
  
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // If no vocabulary provided, use the words from the text
  const vocab = vocabulary.length > 0 ? vocabulary : Array.from(wordFreq.keys());
  
  // Create embedding vector
  return vocab.map(word => wordFreq.get(word) || 0);
}

export function findRelevantChunks(
  query: string,
  chunks: Array<{ content: string; embedding: number[] }>,
  vocabulary: string[],
  topK: number = 3
): Array<{ content: string; score: number; index: number }> {
  const queryEmbedding = generateTextEmbedding(query, vocabulary);
  
  const scores = chunks.map((chunk, index) => ({
    content: chunk.content,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
    index,
  }));

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
