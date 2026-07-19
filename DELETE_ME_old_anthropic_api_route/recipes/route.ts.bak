import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { groceries } = await req.json();

  if (!groceries || typeof groceries !== 'string') {
    return NextResponse.json({ error: 'Missing groceries text.' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set on the server. Add it in Vercel Project Settings > Environment Variables.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Groceries on hand: ${groceries}\n\nSuggest 3 simple, realistic recipes using mainly these ingredients, suited to someone tracking calories for a cut (favor higher protein, reasonable calories). Respond with ONLY raw JSON, no markdown fences, no preamble, in this exact shape:\n{"recipes":[{"name":"","servings":1,"calories":0,"protein":0,"carbs":0,"fat":0,"ingredients":["",""],"instructions":["",""]}]}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${text}` }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Recipe generation failed.' }, { status: 500 });
  }
}
