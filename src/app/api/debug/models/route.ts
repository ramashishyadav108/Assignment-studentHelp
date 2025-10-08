import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // @ts-ignore - client should expose a listModels like method
    const models = await (genAI as any).listModels?.() || null;
    return NextResponse.json({ models });
  } catch (err: any) {
    console.error('List models error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
