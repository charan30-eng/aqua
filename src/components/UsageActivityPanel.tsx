import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Droplet, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { UsageActivityItem } from '../types';

interface UsageActivityPanelProps {
  activities: UsageActivityItem[];
  onOpenLeakageModal: (item?: UsageActivityItem) => void;
  onOpenMeterModal: () => void;
}

export const UsageActivityPanel: React.FC<UsageActivityPanelProps> = ({
  activities,
  onOpenLeakageModal,
  onOpenMeterModal,
}) => {
  const [selectedDay, setSelectedDay] = useState(17);

  const daysOfWeek = [
    { dayNum: 16, dayName: 'Thur' },
    { dayNum: 17, dayName: 'Fri' },
    { dayNum: 18, dayName: 'Sat' },
    { dayNum: 19, dayName: 'Sun' },
    { dayNum: 20, dayName: 'Mon' },
    { dayNum: 21, dayName: 'Tue' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 flex flex-col h-full min-h-[780px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Usage Activity</h2>
          <span className="text-xs font-semibold text-slate-500">June, 2024</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mini Calendar Ribbon matching the mockup */}
      <div className="grid grid-cols-6 gap-1 my-5 text-center">
        {daysOfWeek.map((d) => {
          const isSelected = selectedDay === d.dayNum;
          return (
            <button
              key={d.dayNum}
              onClick={() => setSelectedDay(d.dayNum)}
              className="flex flex-col items-center py-1 group cursor-pointer"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {d.dayNum}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isSelected ? 'text-sky-600 font-bold' : 'text-slate-400'}`}>
                {d.dayName}
              </span>
              {isSelected && (
                <div className="flex gap-0.5 mt-1">
                  <span className="w-1 h-1 rounded-full bg-sky-500"></span>
                  <span className="w-1 h-1 rounded-full bg-sky-400"></span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Activity List Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 max-h-[560px]">
        {activities.map((act) => {
          const isLeakage = act.type === 'leakage';

          return (
            <div
              key={act.id}
              onClick={() => {
                if (isLeakage) {
                  onOpenLeakageModal(act);
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${
                isLeakage
                  ? 'bg-sky-50/70 border-sky-100 hover:bg-sky-50 hover:border-sky-200 hover:shadow-xs'
                  : 'bg-white border-slate-100 hover:bg-slate-50/70'
              }`}
            >
              {/* Round Icon */}
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${
                  isLeakage
                    ? 'bg-sky-100 border-sky-200 text-sky-600'
                    : 'bg-slate-50 border-slate-200/80 text-sky-500'
                }`}
              >
                {isLeakage ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500 stroke-[2.2]" />
                ) : (
                  <Droplet className="w-5 h-5 text-sky-500 fill-sky-100" />
                )}
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-bold truncate ${
                      isLeakage ? 'text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {act.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {act.time}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-extrabold text-sky-600">
                    {act.litres} Ltrs.
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {act.durationMinutes} min
                  </span>

                  {isLeakage && (
                    <span className="ml-auto text-[9px] px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full uppercase tracking-wider">
                      Inspect
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Meter Entry Action */}
      <div className="pt-4 border-t border-slate-100 mt-2">
        <button
          onClick={onOpenMeterModal}
          className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <Droplet className="w-4 h-4 fill-white/30" />
          <span>Record New Meter Reading</span>
        </button>
      </div>
    </div>
  );
};
