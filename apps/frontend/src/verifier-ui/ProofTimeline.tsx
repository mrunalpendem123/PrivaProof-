import { CheckCircle2, Clock, XCircle, ChevronDown, Copy } from 'lucide-react';
import type { Proof } from '../lib/types';
import { useState } from 'react';

interface ProofTimelineProps {
  proofs: Proof[];
}

interface ProofDetailsModalProps {
  proof: Proof;
  onClose: () => void;
}

function ProofDetailsModal({ proof, onClose }: ProofDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-panel rounded-2xl p-6 max-w-2xl w-full cyber-border space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-cyan-400">Proof Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">✕</button>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Proof Type</span>
              <span className="text-sm font-semibold text-slate-200">{proof.proof_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Status</span>
              <StatusBadge status={proof.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Verified At</span>
              <span className="text-sm text-slate-200">{proof.verified_at ? new Date(proof.verified_at).toLocaleString() : 'Pending'}</span>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Proof Hash</span>
              <button onClick={() => copyToClipboard(proof.proof_hash)} className="text-cyan-400 hover:text-cyan-300 transition-colors"><Copy className="w-3 h-3" /></button>
            </div>
            <p className="text-sm font-mono text-slate-200 break-all">{proof.proof_hash}</p>
            {copied && <span className="text-xs text-green-400">Copied!</span>}
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
            <span className="text-sm text-slate-400">Issuer DID</span>
            <p className="text-sm font-mono text-slate-200 break-all">{proof.issuer_did}</p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
            <span className="text-sm text-slate-400">ZK Public Inputs</span>
            <pre className="text-xs font-mono text-slate-300 bg-black/50 p-3 rounded overflow-x-auto">{JSON.stringify(proof.public_inputs, null, 2)}</pre>
          </div>

          <button className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-all">Re-verify Proof</button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Proof['status'] }) {
  const config = {
    verified: { icon: CheckCircle2, text: 'Verified', className: 'bg-green-500/20 text-green-400 border-green-500/50 glow-green' },
    pending: { icon: Clock, text: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 glow-yellow' },
    invalid: { icon: XCircle, text: 'Invalid', className: 'bg-red-500/20 text-red-400 border-red-500/50 glow-red' },
  } as const;
  const { icon: Icon, text, className } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${className}`}>
      <Icon className="w-3 h-3" />
      {text}
    </span>
  );
}

export default function ProofTimeline({ proofs }: ProofTimelineProps) {
  const [expandedProof, setExpandedProof] = useState<string | null>(null);
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);

  const toggleExpand = (proofId: string) => {
    setExpandedProof(expandedProof === proofId ? null : proofId);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sortedProofs = [...proofs].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-cyan-400">Proofs & Verification</h2>

        <div className="space-y-3">
          {sortedProofs.map((proof, index) => (
            <div
              key={proof.id}
              className="glass-panel rounded-xl p-4 cyber-border space-y-3 hover:border-cyan-400/50 transition-all cursor-pointer"
              onClick={() => setSelectedProof(proof)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/30 text-cyan-400 text-xs font-bold">{index + 1}</div>
                    <div>
                      <h3 className="font-semibold text-slate-100">{proof.proof_type}</h3>
                      <p className="text-xs text-slate-400">{formatDate(proof.created_at)}</p>
                    </div>
                  </div>

                  {expandedProof === proof.id && (
                    <div className="ml-11 space-y-2 text-sm">
                      <div className="flex items-center gap-2"><span className="text-slate-400">Hash:</span><span className="font-mono text-cyan-400 text-xs">{proof.proof_hash}</span></div>
                      <div className="flex items-center gap-2"><span className="text-slate-400">Issuer:</span><span className="font-mono text-slate-300 text-xs break-all">{proof.issuer_did}</span></div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={proof.status} />
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleExpand(proof.id); }}
                    className="p-1 hover:bg-slate-800 rounded transition-colors"
                  >
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedProof === proof.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedProof && (
        <ProofDetailsModal proof={selectedProof} onClose={() => setSelectedProof(null)} />
      )}
    </>
  );
}


