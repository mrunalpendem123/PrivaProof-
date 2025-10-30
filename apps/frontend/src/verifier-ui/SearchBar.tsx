import { Search, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 bg-black">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter username or DID to verify identity"
            className="w-full px-6 py-4 pl-14 bg-slate-900/50 border border-cyan-500/30 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:glow-cyan transition-all"
            disabled={loading}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-black font-semibold rounded-lg transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying
              </>
            ) : (
              'Verify Identity'
            )}
          </button>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-4 text-slate-400">
            <span>Example:</span>
            <button type="button" onClick={() => setQuery('@mrinalpendem')} className="text-cyan-400 hover:text-cyan-300 transition-colors">@mrinalpendem</button>
            <span className="text-slate-600">or</span>
            <button type="button" onClick={() => setQuery('did:key:z6MkE4Hj8RqTxM3zKjNq8PwXyLvC9B2nQsDfGhJk')} className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-xs">did:key:z6Mk...</button>
          </div>

          <p className="text-slate-500 text-xs">Proofs are fetched and verified live from Iroh.</p>
        </div>
      </form>
    </div>
  );
}


