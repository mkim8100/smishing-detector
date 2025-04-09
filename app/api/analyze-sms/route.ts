import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// A local type for your message array, so you don't rely on the library's definitions.
type LocalMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const MAX_LENGTH = 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const suspiciousText = body.suspiciousText?.trim();
    const userQuestion = body.userQuestion?.trim();

    if (!suspiciousText || !userQuestion) {
      return NextResponse.json({ error: 'Missing suspiciousText or userQuestion.' }, { status: 400 });
    }

    if (suspiciousText.length > MAX_LENGTH) {
      return NextResponse.json({ error: 'Suspicious text is too long.' }, { status: 400 });
    }

    // Build an array of our local message type.
    const localMessages: LocalMessage[] = [
      {
        role: 'system',
        content: `
You are an AI that helps users analyze suspicious SMS messages for dark patterns.
Provide a concise analysis; if no obvious dark patterns are found, respond with "No obvious dark patterns found."
        `.trim(),
      },
      {
        role: 'user',
        content: `Suspicious SMS: "${suspiciousText}"\nUser Question: "${userQuestion}"`,
      },
    ];

    // Transform localMessages into what the OpenAI library expects:
    // role -> same string, content -> same string
    // The library doesn't require "name" unless you're using function calls.
    const openaiMessages = localMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Create a chat completion using openai@4.x
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // or 'gpt-3.5-turbo' if you prefer
      messages: openaiMessages,
      temperature: 0.3,
      max_tokens: 1000,
    });

    const reply = completion.choices[0]?.message?.content || 'No response from AI.';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error in analyze-sms route:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}