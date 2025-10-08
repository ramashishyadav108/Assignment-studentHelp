import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Default model candidates for educational chatbot
function getModelCandidates(defaults: string[] = ['gemini-2.5-pro', 'gemini-2.5-flash']) {
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
      const model = genAI.getGenerativeModel({ model: modelName });
      // Check token count to avoid exceeding limits
      const { totalTokens } = await model.countTokens(prompt);
      if (totalTokens > 1048576) {
        throw new Error(`Prompt exceeds token limit of 1,048,576 (got ${totalTokens})`);
      }
      const result = await model.generateContent(prompt);
      return result;
    } catch (err: any) {
      lastErr = err;
      console.warn(`Model ${modelName} failed: ${err?.message || err}`);
      continue;
    }
  }
  console.error('All model candidates failed:', lastErr);
  throw new Error('Unable to generate content. Please try again later.');
}

export async function generateQuizQuestions(
  content: string,
  type: 'MCQ' | 'SAQ' | 'LAQ' | 'Mixed',
  count: number,
  difficulty: 'Easy' | 'Medium' | 'Hard'
) {
  // Truncate content to avoid token limit (approximate 4 chars per token)
  const truncatedContent = content.substring(0, 500000);
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
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
    return JSON.parse(jsonText);
  } catch (err: any) {
    console.error('Failed to generate quiz questions:', err);
    throw new Error('Unable to generate quiz questions due to model error.');
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
    return result.response.text();
  } catch (err: any) {
    console.error('Failed to generate answer explanation:', err);
    throw new Error('Unable to generate answer explanation due to model error.');
  }
}

export async function generateChatResponse(
  message: string,
  context: string,
  pdfChunks?: Array<{ content: string; pageNumber: number }>
) {
  // Truncate context to avoid token limit
  const truncatedContext = context.substring(0, 100000);
  let prompt = `You are an educational assistant helping students learn from their coursebooks.

Context from PDF:
${truncatedContext}

`;

  if (pdfChunks && pdfChunks.length > 0) {
    prompt += `Relevant excerpts from the PDF:\n`;
    let totalChunkLength = 0;
    // Limit to 5 chunks to avoid token overflow
    pdfChunks.slice(0, 5).forEach((chunk, idx) => {
      const chunkContent = chunk.content.substring(0, 10000);
      if (totalChunkLength + chunkContent.length <= 400000) {
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
    return result.response.text();
  } catch (err: any) {
    console.error('Failed to generate chat response:', err);
    throw new Error('Unable to generate response due to model error.');
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