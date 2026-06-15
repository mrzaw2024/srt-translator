import { NextRequest, NextResponse } from 'next/server';

const OPENAI_KEYS = (process.env.OPENAI_API_KEYS || '')
  .split(',')
  .map(k => k.trim())
  .filter(k => k.startsWith('sk-'));

let currentKeyIndex = 0;
let keyFailureCount: Record<string, number> = {};

function getNextKey(): string {
  if (OPENAI_KEYS.length === 0) return '';
  const key = OPENAI_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % OPENAI_KEYS.length;
  return key;
}

function isRateLimitError(error: any): boolean {
  const message = error?.message || '';
  return message.includes('429') || message.includes('rate') || message.includes('quota');
}

async function callOpenAI(text: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a professional translator. Translate to Myanmar (Burmese). Return ONLY translation, no explanations.' },
        { role: 'user', content: `Translate to Myanmar (Burmese):\n\n${text}` }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = new Error(`API Error: ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || text;
}

async function translateWithOpenAI(text: string): Promise<string> {
  if (OPENAI_KEYS.length === 0) {
    throw new Error('No OpenAI API keys configured. Please add OPENAI_API_KEYS environment variable.');
  }

  for (let i = 0; i < OPENAI_KEYS.length; i++) {
    const apiKey = getNextKey();
    try {
      const result = await callOpenAI(text, apiKey);
      keyFailureCount[apiKey] = 0;
      return result;
    } catch (error: any) {
      console.warn(`Key ${i + 1} failed: ${error.message}`);
      if (isRateLimitError(error)) {
        console.log('Rate limit detected, switching to next key...');
        continue;
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }

  throw new Error(`All ${OPENAI_KEYS.length} OpenAI API keys failed.`);
}

async function translateLine(line: string): Promise<string> {
  if (!line.trim()) return line;
  if (/^\d+$/.test(line.trim())) return line;
  if (line.includes("-->")) return line;
  return await translateWithOpenAI(line);
}

export async function POST(request: NextRequest) {
  try {
    const { srtContent } = await request.json();
    if (!srtContent) {
      return NextResponse.json({ error: 'No SRT content' }, { status: 400 });
    }

    const lines = srtContent.split(/\r?\n/);
    const result: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      try {
        const translated = await translateLine(lines[i]);
        result.push(translated);
      } catch (error) {
        result.push(lines[i]);
      }
      await new Promise(r => setTimeout(r, 200));
    }
    
    return NextResponse.json({ success: true, translatedSRT: result.join("\n") });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
