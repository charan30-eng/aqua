import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sprout, Factory, Home } from 'lucide-react';
import { dailySectorData } from '../data/initialData';

interface SectorsUsageChartProps {
  onDayClick?: (day: string, liters: number) => void;
}

export const SectorsUsageChart: React.FC<SectorsUsageChartProps> = ({ onDayClick }) => {
  const [selectedSector, setSelectedSector] = useState<'agriculture' | 'industry' | 'domestic'>('domestic');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'hour' | 'day' | 'month' | 'year'>('day');
  const [hoveredBar, setHoveredBar] = useState<{ day: string; val: number; x: number; y: number } | null>(null);

  // Sector multiplier to adjust values interactively
  const multiplier = selectedSector === 'agriculture' ? 1.25 : selectedSector === 'industry' ? 0.85 : 1.0;

  const sectors = [
    { id: 'agriculture', label: 'Agriculture', icon: Sprout },
    { id: 'industry', label: 'Industry', icon: Factory },
    { id: 'domestic', label: 'Domestic Use', icon: Home },
  ];

  const timeframes = ['Hour', 'Day', 'Month', 'Year'];
  const maxScale = 4000;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          Water Usage - Across Sectors
        </h2>

        {/* Sector Tabs matching mockup */}
        <div className="flex items-center gap-1 p-1 bg-[#f0f7fb] border border-sky-100 rounded-full self-start sm:self-auto">
          {sectors.map((s) => {
            const Icon = s.icon;
            const isSelected = selectedSector === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSector(s.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-header with timeframe buttons & month picker */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-6 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-4">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf.toLowerCase() as any)}
              className={`font-semibold cursor-pointer pb-1 transition-colors ${
                selectedTimeframe === tf.toLowerCase()
                  ? 'text-sky-600 border-b-2 border-sky-500'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <button className="p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
          <span className="font-semibold text-slate-700">June 2024</span>
          <button className="p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="relative h-56 w-full pt-4">
        {/* Y-Axis Grid Lines & Labels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
          {[4000, 3000, 2000, 1000, 0].map((val) => (
            <div key={val} className="flex items-center gap-3 w-full">
              <span className="text-[11px] font-mono text-slate-400 w-11 text-right">
                {val} l
              </span>
              <div className="h-px bg-slate-100 flex-1 border-t border-dashed border-slate-200/60" />
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div className="relative ml-14 h-[calc(100%-28px)] flex items-end justify-between gap-1 sm:gap-2 z-10 px-1">
          {dailySectorData.map((item, index) => {
            const adjustedVal = Math.min(maxScale, Math.round(item.val * multiplier));
            const heightPercent = Math.max(3, (adjustedVal / maxScale) * 100);
            const isHighlighted = item.day === '17'; // Today in mockup

            return (
              <div
                key={item.day}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredBar({
                    day: item.day,
                    val: adjustedVal,
                    x: rect.x + rect.width / 2,
                    y: rect.y,
                  });
                }}
                onMouseLeave={() => setHoveredBar(null)}
                onClick={() => onDayClick && onDayClick(item.day, adjustedVal)}
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[14px] rounded-t-xs transition-all duration-300 ${
                    isHighlighted
                      ? 'bg-sky-500 shadow-md shadow-sky-500/20 ring-1 ring-sky-400'
                      : 'bg-sky-400/85 hover:bg-sky-500 group-hover:scale-y-[1.02] origin-bottom'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="ml-14 flex items-center justify-between pt-2 px-1 text-[11px] font-mono text-slate-400 border-t border-slate-100">
          <span>01</span>
          <span>05</span>
          <span>10</span>
          <span>15</span>
          <span>20</span>
          <span>25</span>
          <span>30</span>
        </div>

        {/* Interactive Tooltip */}
        {hoveredBar && (
          <div className="absolute top-0 right-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg border border-slate-700 pointer-events-none z-30 animate-fade-in flex items-center gap-2">
            <span className="font-semibold text-sky-300">June {hoveredBar.day}:</span>
            <span className="font-bold">{hoveredBar.val} Litres</span>
            <span className="text-slate-400 font-mono">({(hoveredBar.val / 1000).toFixed(2)} KL)</span>
          </div>
        )}
      </div>
    </div>
  );
};
