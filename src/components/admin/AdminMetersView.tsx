import React, { useState } from 'react';
import { Gauge, CheckCircle2, Wrench, XCircle, Search, PlusCircle, RefreshCw } from 'lucide-react';
import { initialMeters } from '../../data/adminInitialData';
import { MeterDetail } from '../../types';

interface AdminMetersViewProps {
  onOpenMeterModal: () => void;
}

export const AdminMetersView: React.FC<AdminMetersViewProps> = ({ onOpenMeterModal }) => {
  const [meters, setMeters] = useState<MeterDetail[]>(initialMeters);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleStatus = (meterNumber: string) => {
    setMeters((prev) =>
      prev.map((m) => {
        if (m.meterNumber === meterNumber) {
          const nextStatus = m.status === 'active' ? 'maintenance' : m.status === 'maintenance' ? 'inactive' : 'active';
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
  };

  const filteredMeters = meters.filter((m) => {
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchesSearch =
      m.meterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.consumerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sector.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="w-5 h-5 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Water Meter Fleet &amp; IoT Telemetry Management
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Monitoring {meters.length} ultrasonic and smart-pulse meters across all 4 municipal zones.
          </p>
        </div>

        <button
          onClick={onOpenMeterModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Meter Delta</span>
        </button>
      </div>

      {/* Filters and search */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'active', 'maintenance', 'inactive'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#0284c7] text-white font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {st} ({st === 'all' ? meters.length : meters.filter((m) => m.status === st).length})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meter number or consumer..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>
      </div>

      {/* Meters Grid Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="pb-3 font-semibold">Meter ID &amp; Model</th>
              <th className="pb-3 font-semibold">Assigned Consumer</th>
              <th className="pb-3 font-semibold">Municipal Sector</th>
              <th className="pb-3 font-semibold">Last Reading (KL)</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMeters.map((m) => (
              <tr key={m.meterNumber} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3">
                  <div className="font-mono font-bold text-sky-700">{m.meterNumber}</div>
                  <div className="text-[10px] text-slate-500">{m.model}</div>
                </td>
                <td className="py-3">
                  <div className="font-semibold text-slate-800">{m.consumerName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{m.consumerID}</div>
                </td>
                <td className="py-3 text-slate-600 font-medium">{m.sector}</td>
                <td className="py-3">
                  <span className="font-mono font-bold text-slate-800">{m.lastReadingKL} KL</span>
                  <div className="text-[10px] text-slate-400">{m.lastReadingDate}</div>
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : m.status === 'maintenance'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {m.status === 'active' && <CheckCircle2 className="w-2.5 h-2.5" />}
                    {m.status === 'maintenance' && <Wrench className="w-2.5 h-2.5" />}
                    {m.status === 'inactive' && <XCircle className="w-2.5 h-2.5" />}
                    <span className="capitalize">{m.status}</span>
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => toggleStatus(m.meterNumber)}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1 border border-slate-200"
                    title="Toggle status: active -> maintenance -> inactive"
                  >
                    <RefreshCw className="w-3 h-3 text-sky-600" />
                    <span>Change Status</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
