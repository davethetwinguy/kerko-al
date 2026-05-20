import { writeFileSync } from 'fs';

const code = `'use client';
import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setAiSuggestion('');
    setSearched(true);
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setResults(data.results || []);
    setAiSuggestion(data.aiSuggestion || '');
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <span className="text-green-700 font-bold text-xl">Kerko.al</span>
        <span className="text-xs text-gray-400">Powered by AI</span>
      </nav>
      <div className="bg-green-700 px-6 py-12 text-center">
        <h1 className="text-white text-3xl font-bold mb-2">Gjej cmimin me te mire</h1>
        <p className="text-green-200 text-sm mb-8">AI kerkon per ty ne te gjitha tregjet shqiptare</p>
        <div className="max-w-xl mx-auto flex gap-2 bg-white rounded-2xl p-2">
          <input
            className="flex-1 px-4 py-2 text-sm text-gray-800 outline-none"
            placeholder="p.sh. iPhone 15, Canon EOS..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <button onClick={search} className="bg-green-700 text-white px-6 py-2 rounded-xl text-sm font-semibold">
            Kerko
          </button>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🤖</div>
            <p className="text-gray-600 font-medium">Po kerkoj ne te gjitha burimet...</p>
          </div>
        )}
        {aiSuggestion && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5">
            <p className="text-green-800 font-semibold text-sm">🤖 {aiSuggestion}</p>
          </div>
        )}
        {results.map((item, i) => (
          <div key={i} className={"bg-white rounded-2xl border p-5 mb-3 " + (i === 0 ? "border-green-400" : "border-gray-100")}>
            <div className="flex justify-between gap-3">
              <h3 className="text-gray-800 font-semibold text-sm">{item.title}</h3>
              <p className="text-green-700 font-bold whitespace-nowrap">{item.price}</p>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {i === 0 && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Rekomandohet</span>}
              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{item.source}</span>
              <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{item.condition}</span>
            </div>
            <p className="text-gray-400 text-xs mt-2">{item.description}</p>
            <div className="flex justify-between mt-3 pt-3 border-t border-gray-50">
              <span className="text-xs text-gray-400">{item.seller}</span>
              <a href={item.url} target="_blank" rel="noreferrer" className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg">Shiko</a>
            </div>
          </div>
        ))}
        {!loading && !searched && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛍️</div>
            <p className="text-gray-400 font-medium">Shkruaj produktin qe po kerkon</p>
          </div>
        )}
      </div>
      <footer className="text-center py-8 text-gray-300 text-xs">
        <p>2025 Kerko.al - Powered by AI</p>
      </footer>
    </main>
  );
}
`;

writeFileSync('app/page.tsx', code);
console.log('Done!');