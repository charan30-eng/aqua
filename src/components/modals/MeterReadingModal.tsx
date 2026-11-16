import React, { useState, useEffect } from 'react';
import { X, Gauge, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Consumer, WaterRecord, TariffConfig } from '../../types';

interface MeterReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumers: Consumer[];
  currentConsumer: Consumer;
  tariff: TariffConfig;
  onSubmitReading: (record: WaterRecord, shouldGenerateBill: boolean) => void;
  getLatestReading: (consumerId: string) => number;
}

export const MeterReadingModal: React.FC<MeterReadingModalProps> = ({
  isOpen,
  onClose,
  consumers,
  currentConsumer,
  tariff,
  onSubmitReading,
  getLatestReading,
}) => {
  if (!isOpen) return null;

  const [selectedConsumerId, setSelectedConsumerId] = useState(currentConsumer.consumerID);
  const [month, setMonth] = useState('July');
  const [year, setYear] = useState(2024);
  const [prevReading, setPrevReading] = useState(254);
  const [currReading, setCurrReading] = useState(285);
  const [generateBill, setGenerateBill] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync previous reading when consumer changes
  useEffect(() => {
    const last = getLatestReading(selectedConsumerId);
    setPrevReading(last > 0 ? last : 100);
    setCurrReading(last > 0 ? Math.round(last + 25) : 125);
  }, [selectedConsumerId, getLatestReading]);

  const consumptionKL = Math.max(0, currReading - prevReading);
  const consumptionLitres = consumptionKL * 1000;
  const isExcess = consumptionKL > tariff.leakageThresholdKL;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currReading < prevReading) {
      setError(`Validation Error: Current reading (${currReading} KL) cannot be less than previous reading (${prevReading} KL). Water consumption cannot be negative.`);
      return;
    }

    const newRecord: WaterRecord = {
      recordID: `REC${Math.floor(1000 + Math.random() * 9000)}`,
      consumerID: selectedConsumerId,
      month,
      year,
      previousReading: Number(prevReading),
      currentReading: Number(currReading),
      consumptionKL,
      consumptionLitres,
      recordDate: new Date().toISOString().split('T')[0],
    };

    onSubmitReading(newRecord, generateBill);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Module 2: Water Consumption Monitoring</h3>
              <p className="text-xs text-slate-500">Record smart meter readings &amp; validate volume</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Consumer Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Household / Consumer
            </label>
            <select
              value={selectedConsumerId}
              onChange={(e) => setSelectedConsumerId(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              {consumers.map((c) => (
                <option key={c.consumerID} value={c.consumerID}>
                  {c.consumerID} - {c.name} ({c.address})
                </option>
              ))}
            </select>
          </div>

          {/* Billing Cycle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Billing Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(
                  (m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-mono rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* Readings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Previous Reading (KL)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={prevReading}
                onChange={(e) => {
                  setPrevReading(Number(e.target.value));
                  setError(null);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Current Reading (KL) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={currReading}
                onChange={(e) => {
                  setCurrReading(Number(e.target.value));
                  setError(null);
                }}
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-mono font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Live Calculated Delta Card */}
          <div className="p-4 bg-sky-50/80 border border-sky-100 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-sky-200/50">
              <span className="font-semibold uppercase tracking-wider text-sky-800">
                Formula: Current Reading - Previous Reading
              </span>
              <span className="font-mono text-sky-700">1 KL = 1,000 Litres</span>
            </div>
            <div className="flex items-center justify-between pt-2.5">
              <div>
                <p className="text-xs text-slate-500 font-medium">Net Consumption (KL):</p>
                <p className="text-xl font-extrabold text-sky-600 font-mono">
                  {consumptionKL.toFixed(2)} KL
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Converted Litres:</p>
                <p className="text-xl font-extrabold text-slate-800 font-mono">
                  {consumptionLitres.toLocaleString()} L
                </p>
              </div>
            </div>

            {isExcess && (
              <div className="mt-3 p-2.5 bg-amber-100/90 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span className="font-medium">
                  High volume surge: &gt; {tariff.leakageThresholdKL} KL! Simulated leak warning will be logged.
                </span>
              </div>
            )}
          </div>

          {/* Generate Bill Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={generateBill}
              onChange={(e) => setGenerateBill(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800">
                Auto-generate monthly water bill (Module 4)
              </span>
              <p className="text-slate-500 text-[11px]">
                Immediately computes progressive slab charges and saves bill invoice
              </p>
            </div>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Meter Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
