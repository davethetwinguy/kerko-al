import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function scrapeMetrjep(query) {
  try {
    const url = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=https://www.merrjep.al/njoftime?q=${encodeURIComponent(query)}&render=true`;
    const res = await fetch(url);
    const html = await res.text();
    
    const listings = [];
    const regex = /<div[^>]*class="[^"]*listing[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
    const titleRegex = /class="[^"]*title[^"]*"[^>]*>([^<]+)</i;
    const priceRegex = /class="[^"]*price[^"]*"[^>]*>([^<]+)</i;
    const linkRegex = /href="([^"]*njoftime[^"]*)"/i;

    let match;
    let count = 0;
    while ((match = regex.exec(html)) !== null && count < 5) {
      const block = match[0];
      const titleMatch = block.match(titleRegex);
      const priceMatch = block.match(priceRegex);
      const linkMatch = block.match(linkRegex);
      
      if (titleMatch && priceMatch) {
        listings.push({
          title: titleMatch[1].trim(),
          price: priceMatch[1].trim(),
          url: linkMatch ? `https://www.merrjep.al${linkMatch[1]}` : 'https://www.merrjep.al',
          source: 'Merrjep.al'
        });
        count++;
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

    const scrapedListings = await scrapeMetrjep(query);
    
    let prompt;
    if (scrapedListings.length > 0) {
      prompt = `You are a product search assistant for Albania. The user searched for: "${query}".

Here are real listings scraped from Merrjep.al:
${JSON.stringify(scrapedListings, null, 2)}

Based on these real listings, return a JSON object:
{
  "aiSuggestion": "one sentence recommending the best option and why",
  "results": [
    {
      "title": "product title",
      "price": "price as shown",
      "source": "Merrjep.al",
      "condition": "I ri or Perdorur based on listing",
      "description": "brief description in Albanian",
      "seller": "seller name if available",
      "url": "real url from the listing"
    }
  ]
}
Return ONLY valid JSON, no extra text.`;
    } else {
      prompt = `You are a product search assistant for Albania. The user is searching for: "${query}".

Generate 5 realistic product listings as if from Albanian sites (Merrjep.al, Njoftime.al, Dyqan24, Facebook, Instagram).

Return ONLY valid JSON:
{
  "aiSuggestion": "one sentence recommending the best option and why",
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