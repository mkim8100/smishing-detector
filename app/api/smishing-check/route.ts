import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
// Note: We won't import ChatCompletionCreateParams to avoid strict library type issues.

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // must be set in your environment
});

const MAX_LENGTH = 1000;

/**
 * A local type representing the minimal fields we actually need.
 * We'll transform this into the format openai expects in the final call.
 */
type LocalMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const suspiciousText = body.suspiciousText?.trim();
    const userQuestion = body.userQuestion?.trim();

    // Validate input fields
    if (!suspiciousText || !userQuestion) {
      return NextResponse.json({ error: 'Missing suspiciousText or userQuestion.' }, { status: 400 });
    }

    if (suspiciousText.length > MAX_LENGTH) {
      return NextResponse.json({ error: 'Suspicious text is too long.' }, { status: 400 });
    }

    // Build an array of our local message type
    const localMessages: LocalMessage[] = [
      {
        role: 'system',
        content: `
You are an AI that helps users analyze suspicious SMS messages for dark patterns.
Provide a clear and concise analysis; if no obvious dark patterns are found, respond with "No obvious dark patterns found."
        `.trim(),
      },
      {
        role: 'user',
        content: `Suspicious SMS: "${suspiciousText}"\nUser Question: "${userQuestion}"`,
      },
    ];

    // Transform our local messages into what the openai library expects
    // so TypeScript won't complain about missing "name" fields, etc.
    const openaiMessages = localMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Create a chat completion using GPT-3.5 Turbo (or GPT-4 if you prefer)
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: openaiMessages,
      temperature: 0.3,
      max_tokens: 1000,
    });

    // Extract the AI's reply from the completion response
    const reply = completion.choices[0]?.message?.content || 'No response from AI.';

    // Return the reply as JSON
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error in smishing-check route:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}