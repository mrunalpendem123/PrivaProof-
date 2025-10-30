import { ExternalLink, Copy, User } from 'lucide-react';
import type { Identity } from '../lib/types';
import { useState } from 'react';

interface IdentityOverviewProps {
  identity: Identity;
}

export default function IdentityOverview({ identity }: IdentityOverviewProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="glass-panel rounded-2xl p-6 cyber-border space-y-6">
      <h2 className="text-lg font-semibold text-cyan-400 mb-4">Identity Overview</h2>

      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          {identity.profile_image_url ? (
            <img
              src={identity.profile_image_url}
              alt={identity.username}
              className="w-24 h-24 rounded-full border-2 border-cyan-500/50 glow-cyan"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-2 border-cyan-500/50 glow-cyan bg-slate-800 flex items-center justify-center">
              <User className="w-12 h-12 text-cyan-400" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-slate-900 glow-green"></div>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-100">{identity.username}</h3>
          <p className="text-xs text-slate-400">Last updated: {formatDate(identity.last_updated)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-900/50 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">DID</span>
            <button
              onClick={() => copyToClipboard(identity.did, 'did')}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm font-mono text-slate-200 break-all">
            {identity.did}
          </p>
          {copied === 'did' && (
            <span className="text-xs text-green-400">Copied!</span>
          )}
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Iroh Blob Hash</span>
            <button
              onClick={() => copyToClipboard(identity.iroh_hash, 'hash')}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm font-mono text-slate-200 break-all">
            {identity.iroh_hash}
          </p>
          {copied === 'hash' && (
            <span className="text-xs text-green-400">Copied!</span>
          )}
        </div>
      </div>

      <button className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm font-medium transition-all flex items-center justify-center gap-2 cyber-border">
        <ExternalLink className="w-4 h-4" />
        Open on Iroh Explorer
      </button>

      <div className="bg-slate-900/30 rounded-lg p-4 flex items-center justify-center">
        <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
          <div className="text-xs text-slate-900 font-mono text-center p-2">
            QR Code
            <br />
            {identity.username}
          </div>
        </div>
      </div>
    </div>
  );
}

