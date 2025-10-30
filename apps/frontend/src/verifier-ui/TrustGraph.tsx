import { useEffect, useRef } from 'react';
import type { TrustConnection } from '../lib/types';

interface TrustGraphProps {
  connections: TrustConnection[];
  username: string;
}

export default function TrustGraph({ connections, username }: TrustGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const centerX = width / 2; const centerY = height / 2; const centerRadius = 40; const orbitRadius = 150;
    ctx.shadowBlur = 20; ctx.shadowColor = 'rgba(6, 182, 212, 0.5)'; ctx.fillStyle = 'rgba(6, 182, 212, 0.2)'; ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(226, 232, 240, 1)'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(username, centerX, centerY);
    connections.forEach((connection, index) => {
      const angle = (index * 2 * Math.PI) / Math.max(1, connections.length);
      const x = centerX + Math.cos(angle) * orbitRadius; const y = centerY + Math.sin(angle) * orbitRadius;
      const strength = connection.connection_strength / 100;
      const color = strength > 0.8 ? '34, 197, 94' : strength > 0.6 ? '250, 204, 21' : '239, 68, 68';
      ctx.strokeStyle = `rgba(${color}, ${strength * 0.6})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(x, y); ctx.stroke();
      ctx.shadowBlur = 15; ctx.shadowColor = `rgba(${color}, 0.5)`; ctx.fillStyle = `rgba(${color}, 0.3)`; ctx.strokeStyle = `rgba(${color}, 0.8)`; ctx.lineWidth = 2;
      const nodeRadius = 30; ctx.beginPath(); ctx.arc(x, y, nodeRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(226, 232, 240, 1)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const words = connection.issuer_name.split(' ');
      if (words.length > 1) { ctx.fillText(words[0], x, y - 5); ctx.fillText(words.slice(1).join(' '), x, y + 5); } else { ctx.fillText(connection.issuer_name, x, y); }
      ctx.fillStyle = `rgba(${color}, 1)`; ctx.font = 'bold 10px sans-serif'; ctx.fillText(`${connection.connection_strength}%`, x, y + nodeRadius + 12);
    });
  }, [connections, username]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-cyan-400">Trust Graph</h2>
      <div className="glass-panel rounded-2xl p-6 cyber-border">
        <canvas ref={canvasRef} width={600} height={400} className="w-full h-auto" />
      </div>
      <div className="glass-panel rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Trust Connections</h3>
        {connections.map((connection) => (
          <div key={connection.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-200">{connection.issuer_name}</p>
              <p className="text-xs font-mono text-slate-400">{connection.issuer_did}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className={`${connection.connection_strength > 80 ? 'bg-green-500' : connection.connection_strength > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${connection.connection_strength}%`, height: '100%' }} />
              </div>
              <span className="text-sm font-bold text-slate-300 w-10 text-right">{connection.connection_strength}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


