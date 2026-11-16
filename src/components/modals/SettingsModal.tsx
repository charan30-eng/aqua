import React, { useState } from 'react';
import { X, Settings, RotateCcw, Save, CheckCircle2 } from 'lucide-react';
import { TariffConfig } from '../../types';
import { DEFAULT_TARIFF } from '../../utils/billingCalculator';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tariff: TariffConfig;
  onSaveTariff: (updated: TariffConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  tariff,
  onSaveTariff,
}) => {
  if (!isOpen) return null;

  const [slab1Rate, setSlab1Rate] = useState(tariff.slab1Rate);
  const [slab2Rate, setSlab2Rate] = useState(tariff.slab2Rate);
  const [slab3Rate, setSlab3Rate] = useState(tariff.slab3Rate);
  const [slab4Rate, setSlab4Rate] = useState(tariff.slab4Rate);
  const [serviceCharge, setServiceCharge] = useState(tariff.fixedServiceCharge);
  const [leakageThreshold, setLeakageThreshold] = useState(tariff.leakageThresholdKL);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTariff({
      ...tariff,
      slab1Rate: Number(slab1Rate),
      slab2Rate: Number(slab2Rate),
      slab3Rate: Number(slab3Rate),
      slab4Rate: Number(slab4Rate),
      fixedServiceCharge: Number(serviceCharge),
      leakageThresholdKL: Number(leakageThreshold),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    setSlab1Rate(DEFAULT_TARIFF.slab1Rate);
    setSlab2Rate(DEFAULT_TARIFF.slab2Rate);
    setSlab3Rate(DEFAULT_TARIFF.slab3Rate);
    setSlab4Rate(DEFAULT_TARIFF.slab4Rate);
    setServiceCharge(DEFAULT_TARIFF.fixedServiceCharge);
    setLeakageThreshold(DEFAULT_TARIFF.leakageThresholdKL);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Tariff &amp; System Configuration</h3>
              <p className="text-xs text-slate-500 font-medium">Progressive billing rates &amp; leak thresholds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Tariff configuration saved and applied across billing engine!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Progressive Slabs Tariff Structure
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Slab 1 (0 – 10 KL) Rate (₹/KL)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={slab1Rate}
                  onChange={(e) => setSlab1Rate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Slab 2 (11 – 20 KL) Rate (₹/KL)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={slab2Rate}
                  onChange={(e) => setSlab2Rate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Slab 3 (21 – 30 KL) Rate (₹/KL)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={slab3Rate}
                  onChange={(e) => setSlab3Rate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Slab 4 (&gt; 30 KL) Rate (₹/KL)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={slab4Rate}
                  onChange={(e) => setSlab4Rate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                Fixed Service Charge (₹)
              </label>
              <input
                type="number"
                step="5"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                Leakage Threshold (KL)
              </label>
              <input
                type="number"
                step="1"
                value={leakageThreshold}
                onChange={(e) => setLeakageThreshold(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Tariff</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
