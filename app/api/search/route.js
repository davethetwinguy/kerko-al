import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getSources(query) {
  const q = query.toLowerCase();

  const isProperty = q.includes('apartament') || q.includes('shtepi') || 
    q.includes('vila') || q.includes('prone') || q.includes('qira') ||
    q.includes('property') || q.includes('house') || q.includes('apartment') ||
    q.includes('flat') || q.includes('rent') || q.includes('buy house');

  const isElectronics = q.includes('iphone') || q.includes('samsung') ||
    q.includes('laptop') || q.includes('pc') || q.includes('tv') ||
    q.includes('telefon') || q.includes('kompjuter') || q.includes('tablet') ||
    q.includes('camera') || q.includes('kamera') || q.includes('macbook') ||
    q.includes('playstation') || q.includes('xbox') || q.includes('monitor');

  const isCar = q.includes('makine') || q.includes('car') || q.includes('auto') ||
    q.includes('vetura') || q.includes('bmw') || q.includes('mercedes') ||
    q.includes('toyota') || q.includes('volkswagen') || q.includes('audi');

  if (isProperty) {
    return [
      { name: 'Merrjep.al', url: `https://www.merrjep.al/njoftime/q-${encodeURIComponent(query.replace(/ /g, '-'))}`, category: 'Prona' },
      { name: 'PropertyHub.al', url: `https://propertyhub.al/en/?s=${encodeURIComponent(query)}`, category: 'Prona' },
      { name: 'NovaHome.al', url: `https://novahome.al/?s=${encodeURIComponent(query)}`, category: 'Prona' },
      { name: 'Gjirafa.com', url: `https://gjirafa.com/Top/Kerko?q=${encodeURIComponent(query)}`, category: 'Prona' },
    ];
  }

  if (isCar) {
    return [
      { name: 'Merrjep.al', url: `https://www.merrjep.al/njoftime/q-${encodeURIComponent(query.replace(/ /g, '-'))}`, category: 'Makina' },
      { name: 'Gjirafa.com', url: `https://gjirafa.com/Top/Kerko?q=${encodeURIComponent(query)}`, category: 'Makina' },
    ];
  }

  if (isElectronics) {
    return [
      { name: 'Merrjep.al', url: `https://www.merrjep.al/njoftime/q-${encodeURIComponent(query.replace(/ /g, '-'))}`, category: 'Elektronike' },
      { name: 'Neptun.al', url: `https://www.neptun.al/search-product-result.nspx?q=${encodeURIComponent(query.replace(/ /g, '_'))}`, category: 'Elektronike' },
      { name: 'Gjirafa.com', url: `https://gjirafa.com/Top/Kerko?q=${encodeURIComponent(query)}`, category: 'Elektronike' },
      { name: 'Jumbo.al', url: `https://jumbo.al/sq/catalog?query=${encodeURIComponent(query)}`, category: 'Elektronike' },
    ];
  }

  return [
    { name: 'Merrjep.al', url: `https://www.merrjep.al/njoftime/q-${encodeURIComponent(query.replace(/ /g, '-'))}`, category: 'Te gjitha' },
    { name: 'Gjirafa.com', url: `https://gjirafa.com/Top/Kerko?q=${encodeURIComponent(query)}`, category: 'Te gjitha' },
    { name: 'Neptun.al', url: `https://www.neptun.al/search-product-result.nspx?q=${encodeURIComponent(query.replace(/ /g, '_'))}`, category: 'Te gjitha' },
    { name: 'Jumbo.al', url: `https://jumbo.al/sq/catalog?query=${encodeURIComponent(query)}`, category: 'Te gjitha' },
  ];
}

export async function POST(request) {
  try {
    const { query } = await request.json();
    const sources = getSources(query);

    const prompt = `You are a product search assistant for Albania. The user is searching for: "${query}".

Generate ${sources.length} realistic listings, one for each of these Albanian websites:
${sources.map(s => `- ${s.name}: ${s.url}`).join('\n')}

Return ONLY valid JSON:
{
  "aiSuggestion": "one sentence in Albanian recommending where to find the best deal for this specific product",
  "results": [
    {
      "title": "realistic product title matching the search",
      "price": "realistic price in Leke for Albania market",
      "source": "exact site name from the list",
      "condition": "I ri or Perdorur",
      "description": "2 sentence realistic description in Albanian",
      "seller": "realistic Albanian seller or shop name",
      "url": "use the EXACT url from the list above"
    }
  ]
}
Each result must use a different source. Sort by best value first.`;

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