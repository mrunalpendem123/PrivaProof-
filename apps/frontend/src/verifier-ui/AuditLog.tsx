import { Download, Clock } from 'lucide-react';
import type { AuditLog as AuditLogType } from '../lib/types';

interface AuditLogProps {
  logs: AuditLogType[];
}

export default function AuditLog({ logs }: AuditLogProps) {
  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sortedLogs = [...logs].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cyan-400">Audit Log</h2>
        <button
          onClick={exportJSON}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm font-medium transition-all flex items-center gap-2 cyber-border"
        >
          <Download className="w-4 h-4" />
          Export JSON Report
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-6 cyber-border space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-semibold">Time</th>
                <th className="text-left py-3 px-4 text-slate-400 font-semibold">Date</th>
                <th className="text-left py-3 px-4 text-slate-400 font-semibold">Action</th>
                <th className="text-left py-3 px-4 text-slate-400 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-slate-800 hover:bg-slate-900/30 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-cyan-400">
                    {formatTime(log.created_at)}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="py-3 px-4 text-slate-200 font-medium">
                    {log.action}
                  </td>
                  <td className="py-3 px-4">
                    {log.details.status && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                          log.details.status === 'verified'
                            ? 'bg-green-500/20 text-green-400'
                            : log.details.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {log.details.status === 'verified' && '✅'}
                        {log.details.status === 'pending' && '🟡'}
                        {log.details.status === 'invalid' && '❌'}
                        {log.details.proof_type}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedLogs.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No audit logs available</p>
          </div>
        )}
      </div>
    </div>
  );
}

