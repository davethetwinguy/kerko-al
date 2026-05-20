import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { query } = await request.json();

    const prompt = `You are a product search assistant for Albania. The user is searching for: "${query}".

Generate 5 realistic product listings as if scraped from Albanian sites (Merrjep.al, Njoftime.al, Dyqan24, Facebook, Instagram).

Return ONLY a valid JSON object, no extra text, no markdown:
{
  "aiSuggestion": "one sentence recommending the best option and why",
  "results": [
    {
      "title": "product name and variant",
      "price": "XX,XXX L",
      "source": "site name",
      "condition": "I ri or Përdorur",
      "description": "short listing description in Albanian",
      "seller": "seller name",
      "url": "https://merrjep.al"
    }
  ]
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const json = JSON.parse(clean);
    return Response.json(json);

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}