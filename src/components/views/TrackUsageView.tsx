import React, { useState } from 'react';
import { Gauge, Plus, Search, AlertTriangle, ArrowUpDown, Filter } from 'lucide-react';
import { WaterRecord, Consumer, TariffConfig } from '../../types';

interface TrackUsageViewProps {
  records: WaterRecord[];
  consumers: Consumer[];
  tariff: TariffConfig;
  onOpenMeterModal: () => void;
}

export const TrackUsageView: React.FC<TrackUsageViewProps> = ({
  records,
  consumers,
  tariff,
  onOpenMeterModal,
}) => {
  const [selectedConsumerFilter, setSelectedConsumerFilter] = useState('ALL');

  const filteredRecords = records.filter(
    (r) => selectedConsumerFilter === 'ALL' || r.consumerID === selectedConsumerFilter
  );

  const totalKL = filteredRecords.reduce((acc, r) => acc + r.consumptionKL, 0);
  const avgKL = filteredRecords.length > 0 ? totalKL / filteredRecords.length : 0;
  const maxKL = filteredRecords.reduce((max, r) => Math.max(max, r.consumptionKL), 0);

  const getConsumerName = (id: string) => {
    return consumers.find((c) => c.consumerID === id)?.name || id;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Module 2: Water Consumption Monitoring &amp; Telemetry
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Meter readings, consumption formula delta &amp; logs in <code className="font-mono text-sky-600">data/water_records.txt</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedConsumerFilter}
            onChange={(e) => setSelectedConsumerFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="ALL">All Consumers</option>
            {consumers.map((c) => (
              <option key={c.consumerID} value={c.consumerID}>
                {c.consumerID} - {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenMeterModal}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record Meter Reading</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
            Total Monitored Volume
          </span>
          <div className="text-2xl font-extrabold text-sky-700 font-mono mt-1">
            {totalKL.toFixed(2)} KL
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {(totalKL * 1000).toLocaleString()} Litres captured
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
            Average Monthly Consumption
          </span>
          <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
            {avgKL.toFixed(2)} KL
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Per billing cycle across {filteredRecords.length} records
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
            Peak Recorded Consumption
          </span>
          <div className="text-2xl font-extrabold text-amber-600 font-mono mt-1">
            {maxKL.toFixed(2)} KL
          </div>
          <span className="text-xs text-amber-700 font-medium">
            {maxKL > tariff.leakageThresholdKL ? 'Exceeds 30 KL threshold' : 'Within normal limits'}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">
            Water Records Log (<code className="font-mono text-xs">water_records.txt</code>)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Formula: Consumption = Current - Previous Reading
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-6">Record ID</th>
                <th className="py-3 px-4">Consumer</th>
                <th className="py-3 px-4">Billing Month</th>
                <th className="py-3 px-4 text-right">Prev (KL)</th>
                <th className="py-3 px-4 text-right">Curr (KL)</th>
                <th className="py-3 px-4 text-right">Usage (KL)</th>
                <th className="py-3 px-4 text-right">Usage (Litres)</th>
                <th className="py-3 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredRecords.map((r) => {
                const isHigh = r.consumptionKL > tariff.leakageThresholdKL;
                return (
                  <tr key={r.recordID} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-800">{r.recordID}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-700">
                      <div>
                        <span className="font-bold text-slate-800">{getConsumerName(r.consumerID)}</span>
                        <span className="text-slate-400 font-mono text-[10px] block">{r.consumerID}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-600">
                      {r.month} {r.year}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600">{r.previousReading.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right text-slate-700 font-bold">{r.currentReading.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-sky-700">{r.consumptionKL.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right text-slate-600">{r.consumptionLitres.toLocaleString()}</td>
                    <td className="py-3.5 px-6 text-center font-sans">
                      {isHigh ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px] uppercase">
                          High Usage
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] uppercase">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
