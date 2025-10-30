import { Shield, Circle, Settings } from 'lucide-react';

interface HeaderProps {
  nodeConnected: boolean;
  nodeId: string;
}

export default function Header({ nodeConnected, nodeId }: HeaderProps) {
  return (
    <header className="glass-panel border-b border-cyan-500/20 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-cyan-400">zkID</h1>
            <p className="text-xs text-slate-400">verifier</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Circle
              className={`w-2 h-2 ${nodeConnected ? 'fill-green-500 text-green-500 animate-pulse-glow' : 'fill-red-500 text-red-500'}`}
            />
            <span className="text-slate-400">
              Connected to Iroh Node: <span className="text-cyan-400 font-mono">{nodeId}</span>
            </span>
          </div>

          <button className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <Settings className="w-5 h-5 text-slate-400 hover:text-cyan-400 transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}

