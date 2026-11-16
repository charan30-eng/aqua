import React, { useState } from 'react';
import { ShieldCheck, Search, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { initialAuditLogs } from '../../data/adminInitialData';
import { AuditLogEntry } from '../../types';

export const AdminAuditView: React.FC = () => {
  const [logs] = useState<AuditLogEntry[]>(initialAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-sky-600" />
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Security Audit Trail &amp; Regulatory Compliance
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Append-only compliance log capturing every administrative action, tariff update, meter calibration, and financial transaction with IP origin.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, target, or details..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Lock className="w-3.5 h-3.5 text-sky-600" />
          <span>SHA-256 Tamper Protected</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="pb-3 font-semibold">Timestamp</th>
              <th className="pb-3 font-semibold">Action Code</th>
              <th className="pb-3 font-semibold">Target Entity</th>
              <th className="pb-3 font-semibold">Details</th>
              <th className="pb-3 font-semibold">Origin IP</th>
              <th className="pb-3 font-semibold text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredLogs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 text-slate-500 text-[11px] whitespace-nowrap">{l.timestamp}</td>
                <td className="py-3">
                  <span className="font-bold text-sky-700 text-[11px]">{l.action}</span>
                  <div className="text-[10px] text-slate-400 font-sans">{l.actor}</div>
                </td>
                <td className="py-3 text-slate-700 font-medium font-sans">{l.target}</td>
                <td className="py-3 text-slate-600 font-sans max-w-xs">{l.details}</td>
                <td className="py-3 text-slate-500 text-[11px]">{l.ipAddress}</td>
                <td className="py-3 text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      l.status === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {l.status === 'success' ? (
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    ) : (
                      <AlertTriangle className="w-2.5 h-2.5" />
                    )}
                    <span>{l.status.toUpperCase()}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
