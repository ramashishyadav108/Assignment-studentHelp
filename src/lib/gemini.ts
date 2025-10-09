import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initializer for GoogleGenerativeAI to avoid throwing at import time
let genAI: ReturnType<typeof createGenAI> | null = null;

function createGenAI(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

function getGenAI() {
  if (genAI) return genAI;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set. Set it in your environment (Vercel -> Project -> Environment Variables)');
  }
  genAI = createGenAI(key);
  return genAI;
}

// Default model candidates for educational chatbot
// Using only one model to prevent excessive API calls from fallback attempts
function getModelCandidates(defaults: string[] = ['gemini-1.5-flash']) {
  const env = process.env.GENERATIVE_MODEL_CANDIDATES;
  if (!env) return defaults;
  return env.split(',').map(s => s.trim()).filter(Boolean);
}

// Helper: Try multiple model names until one succeeds for generateContent
async function safeGenerateContent(prompt: string, candidates?: string[]) {
  const candidateList = (candidates && candidates.length) ? candidates : getModelCandidates();
  let lastErr: any = null;
  for (const modelName of candidateList) {
    try {
      const client = getGenAI();
      const model = client.getGenerativeModel({ model: modelName });
      
      // Token count check removed to save 1 API call per request
      // The API will return an error if tokens exceed limit, which we'll handle in catch block

      // Try with retries on transient errors (e.g., 429, 503, overloaded)
      const maxAttempts = 3; // Reduced from 500 to prevent API quota exhaustion
      let attempt = 0;
      while (attempt < maxAttempts) {
        try {
          attempt += 1;
          const result = await model.generateContent(prompt);

          // Validate that we got a response
          if (!result || !result.response) {
            throw new Error('Empty response from model');
          }

          return result;
        } catch (innerErr: any) {
          // If this is a transient error, backoff and retry; otherwise break to try next model
          const status = innerErr?.status;
          const msg = (innerErr?.message || '').toLowerCase();
          const isTransient = status === 429 || status === 503 || msg.includes('overloaded') || msg.includes('temporarily');

          console.error(`Attempt ${attempt} for model ${modelName} failed:`, { message: innerErr?.message, status });

          if (!isTransient) {
            // Non-transient error: stop retrying this model and move to next
            throw innerErr;
          }

          if (attempt >= maxAttempts) {
            // Exhausted retries for this model
            throw innerErr;
          }

          // Linear backoff before next attempt (simpler and faster than exponential)
          const backoffMs = 1000 * attempt; // 1s, 2s, 3s
          await new Promise((res) => setTimeout(res, backoffMs));
          continue;
        }
      }
    } catch (err: any) {
      lastErr = err;
      console.error(`Model ${modelName} failed:`, {
        message: err?.message || 'Unknown error',
        status: err?.status,
        statusText: err?.statusText,
        details: err?.details || err
      });
      continue;
    }
  }
  const errorMessage = lastErr?.message || 'Unknown error occurred';
  console.error('All model candidates failed. Last error:', {
    message: errorMessage,
    error: lastErr
  });
  throw new Error(`Gemini API error: ${errorMessage}. Please check your API key and try again.`);
}

export async function generateQuizQuestions(
  content: string,
  type: 'MCQ' | 'SAQ' | 'LAQ' | 'Mixed',
  count: number,
  difficulty: 'Easy' | 'Medium' | 'Hard'
) {
  // Truncate content to avoid token limit (approximate 4 chars per token)
  // Reduced from 500K to 50K to minimize API token usage
  const truncatedContent = content.substring(0, 50000);
  const prompt = `You are an educational quiz generator. Generate ${count} ${type} questions based on the following content.

Content:
${truncatedContent}

Requirements:
- Difficulty: ${difficulty}
- Question Type: ${type}
${type === 'MCQ' ? '- Provide 4 options (A, B, C, D) for each question' : ''}
- Include the correct answer
- Add a brief explanation for each answer
- Include page references if mentioned in the content

Return the response in the following JSON format:
{
  "questions": [
    {
      "type": "${type}",
      "question": "question text",
      ${type === 'MCQ' ? '"options": ["A) option1", "B) option2", "C) option3", "D) option4"],' : ''}
      "correctAnswer": "answer text",
      "explanation": "explanation text",
      "pageReference": number or null
    }
  ]
}`;

  try {
    const result = await safeGenerateContent(prompt);
    const response = result.response.text();

    if (!response || response.trim() === '') {
      throw new Error('Empty response from Gemini API');
    }

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;

    try {
      return JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini response:', response.substring(0, 500));
      throw new Error('Invalid JSON response from Gemini API');
    }
  } catch (err: any) {
    console.error('Failed to generate quiz questions:', err);
    throw new Error(err.message || 'Unable to generate quiz questions due to model error.');
  }
}

export async function generateAnswerExplanation(
  question: string,
  userAnswer: string,
  correctAnswer: string
) {
  const prompt = `Explain why the answer to this question is correct or incorrect.

Question: ${question}
User's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

Provide a clear, educational explanation that helps the student understand the concept.`;

  try {
    const result = await safeGenerateContent(prompt);
    const response = result.response.text();

    if (!response || response.trim() === '') {
      throw new Error('Empty response from Gemini API');
    }

    return response;
  } catch (err: any) {
    console.error('Failed to generate answer explanation:', err);
    throw new Error(err.message || 'Unable to generate answer explanation due to model error.');
  }
}

export async function generateChatResponse(
  message: string,
  context: string,
  pdfChunks?: Array<{ content: string; pageNumber: number }>
) {
  // Truncate context to avoid token limit
  // Reduced from 100K to 20K to minimize API token usage
  const truncatedContext = context.substring(0, 20000);
  let prompt = `You are an educational assistant helping students learn from their coursebooks.

Context from PDF:
${truncatedContext}

`;

  if (pdfChunks && pdfChunks.length > 0) {
    prompt += `Relevant excerpts from the PDF:\n`;
    let totalChunkLength = 0;
    // Reduced from 5 to 3 chunks to minimize token usage
    pdfChunks.slice(0, 3).forEach((chunk) => {
      const chunkContent = chunk.content.substring(0, 5000); // Reduced from 10K to 5K
      if (totalChunkLength + chunkContent.length <= 50000) { // Reduced from 400K to 50K
        prompt += `\n[Page ${chunk.pageNumber}]: "${chunkContent}"\n`;
        totalChunkLength += chunkContent.length;
      }
    });
    prompt += `\nWhen answering, cite the page number and include a brief quote from the relevant section. Format: "According to page X: 'quote...'"`;
  }

  prompt += `\n\nStudent's Question: ${message}

Please provide a helpful, educational response. If the answer is in the PDF, cite the specific page and quote the relevant text.`;

  try {
    const result = await safeGenerateContent(prompt);
    const response = result.response.text();

    if (!response || response.trim() === '') {
      throw new Error('Empty response from Gemini API');
    }

    return response;
  } catch (err: any) {
    console.error('Failed to generate chat response:', err);
    throw new Error(err.message || 'Unable to generate response due to model error.');
  }
}

export async function extractKeyTopics(content: string): Promise<string[]> {
  // Truncate content to avoid token limit
  const prompt = `Extract the main topics and concepts from this educational content. Return only a JSON array of topic strings.

Content:
${content.substring(0, 500000)}

Return format: ["topic1", "topic2", "topic3"]`;

  try {
    const result = await safeGenerateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (err: any) {
    console.error('extractKeyTopics model error:', err);
    return [];
  }
}