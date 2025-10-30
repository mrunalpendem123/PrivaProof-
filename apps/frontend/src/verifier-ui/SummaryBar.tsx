import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { Proof } from '../lib/types';

interface SummaryBarProps {
  proofs: Proof[];
}

export default function SummaryBar({ proofs }: SummaryBarProps) {
  const counts = {
    verified: proofs.filter((p) => p.status === 'verified').length,
    pending: proofs.filter((p) => p.status === 'pending').length,
    invalid: proofs.filter((p) => p.status === 'invalid').length,
  };

  return (
    <div className="glass-panel rounded-xl p-4 border border-cyan-500/20">
      <div className="flex items-center justify-around gap-4">
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 glow-green">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-2xl font-bold text-green-400">{counts.verified}</p>
            <p className="text-xs text-slate-400">Verified</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 glow-yellow">
          <Clock className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-2xl font-bold text-yellow-400">{counts.pending}</p>
            <p className="text-xs text-slate-400">Pending</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 glow-red">
          <XCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-2xl font-bold text-red-400">{counts.invalid}</p>
            <p className="text-xs text-slate-400">Invalid</p>
          </div>
        </div>
      </div>
    </div>
  );
}


