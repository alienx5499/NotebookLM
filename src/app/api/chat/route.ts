/*
  _  _   _   _  _  ___ _  _ ___
 (_ / \ | | | || |/ __| || | _ \
  _) o /_| |_| __ | (__| __ |   /
 |__|_/  \___|_||_|\___|_||_|_|_\

 NotebookLM Chat API
*/

import { NextRequest, NextResponse } from 'next/server';
import { getVectorStore } from '@/lib/container';
import { GoogleAuth } from 'google-auth-library';
import * as path from 'path';

const PROJECT_ID = 'triple-zenith-457318-b3';
const LOCATION = 'us-central1';
const MODEL = 'gemini-2.5-flash';

export const runtime = 'nodejs';

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

const GENERATION_CONFIG = {
  temperature: 0.4,
  topP: 0.95,
  maxOutputTokens: 4096,
};

async function getAccessToken(): Promise<string> {
  let keyFile: string;

  if (process.env.GCP_JSON_BASE64) {
    const decoded = Buffer.from(process.env.GCP_JSON_BASE64, 'base64').toString('utf-8');
    const tmpPath = path.join('/tmp', 'gcp-vercel.json');
    const fs = await import('fs');
    fs.writeFileSync(tmpPath, decoded);
    keyFile = tmpPath;
  } else {
    keyFile = path.join(process.cwd(), 'gcp.json');
  }

  const auth = new GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return typeof tokenResponse === 'string' ? tokenResponse : (tokenResponse?.token ?? '');
}

async function generateContent(accessToken: string, contents: object[]) {
  const url = `https://aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: GENERATION_CONFIG,
      safetySettings: SAFETY_SETTINGS,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Vertex AI error ${res.status}: ${error}`);
  }

  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const vectorStore = getVectorStore();
    const context = await vectorStore.retrieve(query, 5);

    if (context.length === 0) {
      return NextResponse.json({
        answer:
          'I could not find relevant information in the uploaded document to answer your question. Please try rephrasing or ask about content that appears in the document.',
        sources: [],
      });
    }

    const contextText = context
      .map((doc, i) => `[Source ${i + 1}]: ${doc.pageContent}`)
      .join('\n\n');

    const prompt = `You are an AI assistant helping users understand documents they have uploaded — which may include resumes, PDFs, research papers, or any other content.

You answer questions based on the provided context.

RULES:
1. If the question asks you to evaluate, summarize, rate, critique, or analyze something that IS in the context — DO IT using only the context. For resumes, provide honest feedback on strengths, weaknesses, clarity, and suggestions.
2. If the question asks about something genuinely NOT covered in the context, say so clearly.
3. Cite which source(s) your answer comes from (e.g., "According to the resume...").
4. Do not make up information. Only use what's in the provided context.
5. Be direct and helpful. When evaluating a resume, be constructive but honest.

Context from uploaded document:
${contextText}

User question: ${query}`;

    const accessToken = await getAccessToken();
    const data = await generateContent(accessToken, [{ role: 'user', parts: [{ text: prompt }] }]);

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p?.text)
        .filter((t: string | undefined): t is string => typeof t === 'string')
        .join('') ?? '';

    return NextResponse.json({
      answer: text,
      sources: context,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
