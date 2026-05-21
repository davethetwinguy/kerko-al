import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { query } = await request.json();
    const encodedQuery = encodeURIComponent(query);

    const sources = [
      { name: 'Merrjep.al', url: `https://www.merrjep.al/njoftime?q=${encodedQuery}&kategoria=0` },
      { name: 'Njoftime.al', url: `https://www.njoftime.al/?s=${encodedQuery}` },
      { name: 'Dyqan24', url: `https://dyqan24.al/?s=${encodedQuery}` },
      { name: 'Okazion.al', url: `https://okazion.al/?s=${encodedQuery}` },
      { name: 'Facebook Marketplace', url: `https://www.facebook.com/marketplace/search/?query=${encodedQuery}` },
    ];

    const prompt = `You are a product search assistant for Albania. The user is searching for: "${query}".

Generate 5 realistic product listings as if from Albanian websites. Each listing must use one of these EXACT urls:
${sources.map(s => `- ${s.name}: ${s.url}`).join('\n')}

Return ONLY valid JSON:
{
  "aiSuggestion": "one sentence recommending where to find the best deal and why, in Albanian",
  "results": [
    {
      "title": "realistic product name and variant",
      "price": "realistic price in Leke",
      "source": "site name from the list above",
      "condition": "I ri or Perdorur",
      "description": "short realistic description in Albanian",
      "seller": "realistic Albanian seller name",
      "url": "use the EXACT url from the list above for that source"
    }
  ]
}
Use each source only once. Sort by best value first.`;

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