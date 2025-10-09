import PDFParser from 'pdf2json';
import { readFile } from 'fs/promises';

export interface PDFMetadata {
  title: string;
  totalPages: number;
  text: string;
}

export async function extractPDFText(filePath: string): Promise<PDFMetadata> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', (errData: any) => {
      reject(new Error(errData.parserError));
    });

    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        // Extract text from all pages
        let fullText = '';
        let totalPages = 0;

        if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
          totalPages = pdfData.Pages.length;

          pdfData.Pages.forEach((page: any) => {
            if (page.Texts && Array.isArray(page.Texts)) {
              page.Texts.forEach((text: any) => {
                if (text.R && Array.isArray(text.R)) {
                  text.R.forEach((r: any) => {
                    if (r.T) {
                      // Decode URI-encoded text
                      fullText += decodeURIComponent(r.T) + ' ';
                    }
                  });
                }
              });
              // Add page break
              fullText += '\n\n';
            }
          });
        }

        // Extract title from metadata or use filename
        const title = pdfData.Meta?.Title || 'Untitled';

        resolve({
          title: title,
          totalPages: totalPages,
          text: fullText.trim(),
        });
      } catch (error) {
        reject(error);
      }
    });

    // Load PDF file
    readFile(filePath)
      .then((buffer) => {
        pdfParser.parseBuffer(buffer);
      })
      .catch(reject);
  });
}

export interface PDFChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
}

export function chunkPDFText(text: string, chunkSize: number = 1000): PDFChunk[] {
  const chunks: PDFChunk[] = [];

  // Split by pages first (looking for page break indicators)
  const pagePattern = /\f|\n\s*Page\s+\d+\s*\n|\n\n/gi;
  const pages = text.split(pagePattern).filter(p => p.trim().length > 0);

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
