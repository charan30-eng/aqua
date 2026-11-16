import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { communityMonthlyData } from '../data/initialData';

export const CommunitiesSavingsChart: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [activeMonthIndex, setActiveMonthIndex] = useState(6); // July in 0-indexed list

  const maxScale = 40000;
  const chartHeight = 180;
  const chartWidth = 580;

  // Compute SVG coordinates for smooth cubic bezier paths
  const pointsUsage = communityMonthlyData.map((d, i) => {
    const x = (i / (communityMonthlyData.length - 1)) * chartWidth;
    const y = chartHeight - (d.usage / maxScale) * chartHeight;
    return { x, y };
  });

  const pointsSavings = communityMonthlyData.map((d, i) => {
    const x = (i / (communityMonthlyData.length - 1)) * chartWidth;
    const y = chartHeight - (d.savings / maxScale) * chartHeight;
    return { x, y };
  });

  // Helper to generate smooth SVG path command
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i != pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const usagePath = createSmoothPath(pointsUsage);
  const savingsPath = createSmoothPath(pointsSavings);
  const usageAreaPath = `${usagePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const activePoint = pointsUsage[activeMonthIndex];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80">
      {/* Header and Controls */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          Usage &amp; Savings - Across Communities
        </h2>

        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              Usage
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-500"></span>
              Savings
            </span>
          </div>

          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 py-1.5 pl-3 pr-7 rounded-lg border border-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="2024">Year 2024</option>
              <option value="2023">Year 2023</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Area & Line Chart */}
      <div className="relative h-60 w-full pt-2">
        {/* Y-Axis Grid Lines & Labels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
          {[40000, 30000, 20000, 10000, 0].map((val) => (
            <div key={val} className="flex items-center gap-3 w-full">
              <span className="text-[11px] font-mono text-slate-400 w-11 text-right">
                {val === 0 ? '0' : `${val / 1000}k l`}
              </span>
              <div className="h-px bg-slate-100 flex-1 border-t border-dashed border-slate-200/50" />
            </div>
          ))}
        </div>

        {/* SVG Graphic Area */}
        <div className="relative ml-14 h-[calc(100%-28px)]">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Filled Area under Usage curve */}
            <path d={usageAreaPath} fill="url(#usageGradient)" />

            {/* Usage Line */}
            <path
              d={usagePath}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Savings Line */}
            <path
              d={savingsPath}
              fill="none"
              stroke="#84cc16"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Vertical Dashed Line Indicator for Active Month (July in mockup) */}
            {activePoint && (
              <>
                <line
                  x1={activePoint.x}
                  y1={0}
                  x2={activePoint.x}
                  y2={chartHeight}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="5"
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </>
            )}
          </svg>

          {/* Interactive Community Breakdown Tooltip Card matching the screenshot */}
          {activePoint && (
            <div
              style={{
                left: `${Math.min(75, Math.max(25, (activePoint.x / chartWidth) * 100))}%`,
                top: '25%',
              }}
              className="absolute -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-slate-200/90 text-[11px] w-44 z-20 pointer-events-none"
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 font-bold text-slate-700">
                <span>All Municipal</span>
                <span className="text-sky-600 font-mono">25k l</span>
              </div>
              <div className="pt-1.5 space-y-1 text-slate-500 font-medium">
                <div className="flex justify-between">
                  <span>Hostels / PGs</span>
                  <span className="font-mono text-slate-700">5k l</span>
                </div>
                <div className="flex justify-between">
                  <span>Restaurants / Hotels</span>
                  <span className="font-mono text-slate-700">9k l</span>
                </div>
                <div className="flex justify-between">
                  <span>Hospitals / Clinics</span>
                  <span className="font-mono text-slate-700">7k l</span>
                </div>
                <div className="flex justify-between">
                  <span>Domestic Residencies</span>
                  <span className="font-mono text-slate-700">4k l</span>
                </div>
              </div>
            </div>
          )}

          {/* Invisible click targets along months */}
          <div className="absolute inset-0 flex justify-between">
            {communityMonthlyData.map((d, i) => (
              <div
                key={d.month}
                onClick={() => setActiveMonthIndex(i)}
                className="flex-1 h-full cursor-pointer hover:bg-sky-50/20"
                title={`${d.month}: ${d.usage} l used`}
              />
            ))}
          </div>
        </div>

        {/* X-Axis Month Labels */}
        <div className="ml-14 flex items-center justify-between pt-2 px-1 text-[11px] font-mono text-slate-400 border-t border-slate-100">
          <span>Jan</span>
          <span>March</span>
          <span>May</span>
          <span className="font-bold text-sky-600">July</span>
          <span>Sept</span>
          <span>Nov</span>
          <span>Dec</span>
        </div>
      </div>
    </div>
  );
};
