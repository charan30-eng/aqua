import React, { useState } from 'react';
import { Sliders, CheckCircle2, Zap, Calculator } from 'lucide-react';
import { initialTariffPlans } from '../../data/adminInitialData';
import { TariffPlan, TariffConfig } from '../../types';
import { calculateProgressiveBilling } from '../../utils/billingCalculator';

interface AdminTariffViewProps {
  tariff: TariffConfig;
  onUpdateTariff: (newTariff: TariffConfig) => void;
}

export const AdminTariffView: React.FC<AdminTariffViewProps> = ({ tariff }) => {
  const [plans, setPlans] = useState<TariffPlan[]>(initialTariffPlans);
  const [testConsumptionKL, setTestConsumptionKL] = useState<number>(28);

  const handleActivatePlan = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => ({
        ...p,
        status: p.id === planId ? 'active' : 'inactive',
      }))
    );
  };

  const simCalc = calculateProgressiveBilling(testConsumptionKL, tariff);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-5 h-5 text-sky-600" />
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Tariff Schedules &amp; Progressive Slab Policy Engine
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Fixed-point integer paise billing calculations with configurable marginal tiers, fixed service maintenance, and municipal tax rates.
        </p>
      </div>

      {/* Grid: Tariff Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const isActive = plan.status === 'active';
          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-5 border transition-all ${
                isActive
                  ? 'bg-white border-[#0284c7] shadow-sm ring-2 ring-sky-500/10'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{plan.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        plan.mode === 'slab'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {plan.mode} Tariff
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mt-1">{plan.name}</h3>
                </div>

                {isActive ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    ACTIVE
                  </span>
                ) : (
                  <button
                    onClick={() => handleActivatePlan(plan.id)}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-[#0284c7] hover:text-white text-slate-600 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-slate-200"
                  >
                    Activate
                  </button>
                )}
              </div>

              <div className="bg-[#f0f7fb] rounded-xl p-3 border border-sky-100 text-xs font-mono text-sky-800 mb-4">
                {plan.slabConfig}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-100 pt-3">
                <div>
                  <span className="text-slate-500 text-[10px] block">Base Rate / KL</span>
                  <span className="font-mono font-bold text-slate-800">₹{plan.ratePerKL}.00</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Fixed Charge</span>
                  <span className="font-mono font-bold text-slate-800">₹{plan.fixedCharge}.00</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Municipal Tax</span>
                  <span className="font-mono font-bold text-slate-800">{plan.taxPercentage}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live C-Engine Calculation Simulator Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Live Tariff Simulator (Fixed-Point Integer Paise Engine)
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold uppercase">
            C11 Pure Math
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Slider input */}
          <div className="lg:col-span-5 space-y-3 bg-[#f8fafc] rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Test Consumption Volume</span>
              <span className="text-lg font-black font-mono text-sky-700">{testConsumptionKL} KL</span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              value={testConsumptionKL}
              onChange={(e) => setTestConsumptionKL(Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 KL (Low)</span>
              <span>30 KL (Nominal)</span>
              <span>60 KL (High Surge)</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
              Simulates progressive slab thresholds across Tier 1 (₹5), Tier 2 (₹8), Tier 3 (₹12), and Tier 4 (₹15) plus ₹50 fixed maintenance charge.
            </p>
          </div>

          {/* Result Breakdown Card */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-sky-100 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-sky-800 mb-3 flex items-center justify-between">
              <span>Itemized Calculation Result</span>
              <span className="text-[10px] text-slate-500 font-normal">Paise Precision</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Tier 1 (0-10)</span>
                <span className="font-mono font-bold text-slate-800">₹{simCalc.breakdown.slab1Amount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Tier 2 (11-20)</span>
                <span className="font-mono font-bold text-slate-800">₹{simCalc.breakdown.slab2Amount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Tier 3 (21-30)</span>
                <span className="font-mono font-bold text-slate-800">₹{simCalc.breakdown.slab3Amount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Tier 4 (31+)</span>
                <span className="font-mono font-bold text-slate-800">₹{simCalc.breakdown.slab4Amount}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-sm">
              <div>
                <span className="text-xs text-slate-500">Total Simulated Bill Amount:</span>
                <span className="text-xs text-slate-400 block font-mono">
                  Water: ₹{simCalc.waterCharges} + Fixed: ₹{tariff.fixedServiceCharge}
                </span>
              </div>
              <span className="text-2xl font-black font-mono text-emerald-600">
                ₹{simCalc.totalAmount}.00
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
