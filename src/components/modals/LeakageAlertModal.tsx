import React from 'react';
import { X, AlertTriangle, ShieldCheck, Wrench, Droplet, Check, Info } from 'lucide-react';
import { UsageActivityItem } from '../../types';

interface LeakageAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?: UsageActivityItem | null;
  onResolveLeak?: (id: string) => void;
}

export const LeakageAlertModal: React.FC<LeakageAlertModalProps> = ({
  isOpen,
  onClose,
  activeItem,
  onResolveLeak,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Module 6: Water Leakage &amp; Excess Usage Alert
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Simulation Heuristic Anomaly Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Academic Simulation Notice Banner */}
        <div className="mt-4 p-3.5 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-2.5 text-xs text-sky-900">
          <Info className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
          <div>
            <span className="font-bold">Educational Simulation Notice:</span>
            <p className="text-sky-800 text-[11px] mt-0.5 leading-relaxed">
              This is a software-simulated alert based on consumption telemetry deltas and inactive-window flow patterns. No physical IoT acoustics or pressure sensors are connected.
            </p>
          </div>
        </div>

        {/* Anomaly Diagnosis Details */}
        <div className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Anomaly Pattern
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {activeItem?.status || 'Continuous Flow Anomaly'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Volume Lost / Hour:</span>
              <span className="text-base font-extrabold text-rose-600 font-mono">
                {activeItem?.litres || 15} Litres / hour
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Uninterrupted Duration:</span>
              <span className="text-base font-extrabold text-slate-800 font-mono">
                {activeItem?.durationMinutes || 60} Minutes
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200">
            {activeItem?.details ||
              'Heuristic analysis detected continuous baseline water discharge during zero-occupancy overnight interval. This strongly indicates a dripping faucet, leaking toilet cistern flapper, or underground pipe fissure.'}
          </p>
        </div>

        {/* Recommended Conservation & Repair Measures */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-sky-600" />
            <span>Recommended Water Conservation &amp; Remediation</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <span>
                <strong>Toilet Flapper Test:</strong> Drop 4 drops of food color in the cistern. If color appears in the pan without flushing, replace the worn flapper seal.
              </span>
            </li>
            <li className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <span>
                <strong>Faucet Cartridge Audit:</strong> Replace dried rubber washers or ceramic discs to eliminate persistent dripping.
              </span>
            </li>
            <li className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <span>
                <strong>Main Stopcock Verification:</strong> Turn off all indoor taps. If the meter wheel continues spinning, inspect underground supply line.
              </span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-100 mt-5">
          <button
            onClick={() => {
              if (activeItem && onResolveLeak) {
                onResolveLeak(activeItem.id);
              }
              onClose();
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Mark Simulated Leak as Resolved</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
