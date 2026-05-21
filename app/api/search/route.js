import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function searchGoogle(query, site) {
  try {
    const searchUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(`https://www.google.com/search?q=${query}+site:${site}&num=10`)}`;
    const res = await fetch(searchUrl);
    const html = await res.text();

    const listings = [];
    const linkRegex = /href="(https?:\/\/(?:www\.)?merrjep\.al\/njoftime\/[^"&]+)"/g;
    const titleRegex = /<h3[^>]*>([^<]+)<\/h3>/g;

    const links = [];
    const titles = [];
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      links.push(match[1]);
    }
    while ((match = titleRegex.exec(html)) !== null) {
      titles.push(match[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim());
    }

    for (let i = 0; i < Math.min(links.length, titles.length, 5); i++) {
      if (titles[i] && links[i]) {
        listings.push({
          title: titles[i],
          url: links[i],
          source: site
        });
      }
    }
    return listings;
  } catch (e) {
    return [];
  }
}

export async function POST(request) {
  try {
    const { query } = await request.json();

    const [merrjepResults, njoftimeResults] = await Promise.all([
      searchGoogle(query, 'merrjep.al'),
      searchGoogle(query, 'njoftime.al'),
    ]);

    const allResults = [...merrjepResults, ...njoftimeResults];

    let prompt;
    if (allResults.length > 0) {
      prompt = `You are a product search assistant for Albania. The user searched for: "${query}".

Here are real listings found from Albanian websites:
${JSON.stringify(allResults, null, 2)}

Based on these real listings, return a JSON object. Use the EXACT urls provided:
{
  "aiSuggestion": "one sentence recommending the best option and why in Albanian",
  "results": [
    {
      "title": "product title",
      "price": "estimate a realistic price in Leke based on the product",
      "source": "source website",
      "condition": "I ri or Perdorur",
      "description": "brief description in Albanian",
      "seller": "unknown",
      "url": "use the exact url from the listing"
    }
  ]
}
Return ONLY valid JSON, no extra text.`;
    } else {
      prompt = `You are a product search assistant for Albania. The user is searching for: "${query}".

Generate 5 realistic product listings as if from Albanian sites (Merrjep.al, Njoftime.al, Dyqan24, Facebook, Instagram).

Return ONLY valid JSON:
{
  "aiSuggestion": "one sentence recommending the best option and why in Albanian",
  "results": [
    {
      "title": "product name",
      "price": "XX,XXX L",
      "source": "site name",
      "condition": "I ri or Perdorur",
      "description": "short description in Albanian",
      "seller": "seller name",
      "url": "https://merrjep.al"
    }
  ]
}`;
    }

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