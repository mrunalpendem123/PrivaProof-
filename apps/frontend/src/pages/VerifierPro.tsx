import { useState, useEffect } from 'react';
import Header from '../verifier-ui/Header';
import SearchBar from '../verifier-ui/SearchBar';
import IdentityOverview from '../verifier-ui/IdentityOverview';
import ProofTimeline from '../verifier-ui/ProofTimeline';
import SummaryBar from '../verifier-ui/SummaryBar';
import TrustGraph from '../verifier-ui/TrustGraph';
import AuditLog from '../verifier-ui/AuditLog';
import NodeSettings from '../verifier-ui/NodeSettings';
import type { Identity, Proof, AuditLog as AuditLogType, TrustConnection } from '../lib/types';
import { resolveIdentity } from '../lib/api';
import { Loader2 } from 'lucide-react';

type Tab = 'overview' | 'trust-graph' | 'audit-log' | 'node-settings';

export default function VerifierProPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogType[]>([]);
  const [trustConnections, setTrustConnections] = useState<TrustConnection[]>([]);
  const [nodeConnected] = useState(true);
  const [nodeId] = useState('iroh-local');

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const { identity, proofs, logs, connections } = await resolveIdentity(query);
      if (!identity) {
        alert('Identity not found');
        setIdentity(null);
        setProofs([]);
        setAuditLogs([]);
        setTrustConnections([]);
        setLoading(false);
        return;
      }
      setIdentity(identity);
      setProofs(proofs);
      setAuditLogs(logs);
      setTrustConnections(connections);
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching for identity');
      setIdentity(null);
      setProofs([]);
      setAuditLogs([]);
      setTrustConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConnection = (useLocal: boolean) => {
    console.log('Toggle connection:', useLocal);
  };

  useEffect(() => {
    // Auto-load a default search on mount (like your App.tsx)
    // Only search if we haven't loaded anything yet (prevents re-searching)
    if (!identity) {
      handleSearch('@mrinalpendem');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Header nodeConnected={nodeConnected} nodeId={nodeId} />

      <SearchBar onSearch={handleSearch} loading={loading} />

      {loading && !identity && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      )}

      {identity && (
        <>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="mb-6">
              <SummaryBar proofs={proofs} />
            </div>

            <div className="flex gap-2 mb-6 glass-panel rounded-xl p-2 w-fit">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'overview'
                    ? 'bg-cyan-500 text-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('trust-graph')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'trust-graph'
                    ? 'bg-cyan-500 text-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Trust Graph
              </button>
              <button
                onClick={() => setActiveTab('audit-log')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'audit-log'
                    ? 'bg-cyan-500 text-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Audit Log
              </button>
              <button
                onClick={() => setActiveTab('node-settings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'node-settings'
                    ? 'bg-cyan-500 text-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Node Settings
              </button>
            </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <IdentityOverview identity={identity} />
              </div>
              <div className="lg:col-span-2">
                <ProofTimeline proofs={proofs} />
              </div>
            </div>
          )}

          {activeTab === 'trust-graph' && (
            <TrustGraph connections={trustConnections} username={identity.username} />
          )}

          {activeTab === 'audit-log' && <AuditLog logs={auditLogs} />}

          {activeTab === 'node-settings' && (
            <NodeSettings nodeConnected={nodeConnected} nodeId={nodeId} onToggleConnection={handleToggleConnection} />
          )}
          </div>
        </>
      )}
    </div>
  );
}


