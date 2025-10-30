import { Circle, Server, Info } from 'lucide-react';
import { useState } from 'react';

interface NodeSettingsProps {
  nodeConnected: boolean;
  nodeId: string;
  onToggleConnection: (useLocal: boolean) => void;
}

export default function NodeSettings({ nodeConnected, nodeId, onToggleConnection }: NodeSettingsProps) {
  const [useLocal, setUseLocal] = useState(true);

  const handleToggle = () => {
    const newValue = !useLocal;
    setUseLocal(newValue);
    onToggleConnection(newValue);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-cyan-400">Node Settings</h2>

      <div className="glass-panel rounded-2xl p-6 cyber-border space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Connection Type</p>
                <p className="text-xs text-slate-400">
                  {useLocal ? 'Using local Iroh node' : 'Connected to public relay'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggle}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                useLocal ? 'bg-cyan-500' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  useLocal ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <Circle
                className={`w-4 h-4 ${
                  nodeConnected
                    ? 'fill-green-500 text-green-500 animate-pulse-glow'
                    : 'fill-red-500 text-red-500'
                }`}
              />
              <p className="text-sm font-semibold text-slate-200">Connection Status</p>
            </div>

            <div className="ml-7 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Status</span>
                <span
                  className={`text-xs font-semibold ${
                    nodeConnected ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {nodeConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Node ID</span>
                <span className="text-xs font-mono text-cyan-400">{nodeId}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Version</span>
                <span className="text-xs text-slate-300">v0.21.0</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Protocol</span>
                <span className="text-xs text-slate-300">QUIC</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-cyan-400">About Iroh Nodes</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Iroh is a distributed system for syncing data over direct connections. Local nodes
                provide faster performance, while public relays enable connectivity across
                restrictive networks.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Network Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-cyan-400">127</p>
              <p className="text-xs text-slate-400 mt-1">Peers Connected</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-cyan-400">2.4k</p>
              <p className="text-xs text-slate-400 mt-1">Documents Synced</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-cyan-400">98.7%</p>
              <p className="text-xs text-slate-400 mt-1">Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

