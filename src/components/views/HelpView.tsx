import React from 'react';
import { HelpCircle, BookOpen, Terminal, Droplet, Shield, Code2, Download } from 'lucide-react';
import { downloadCProjectZip } from '../../utils/zipExporter';

interface HelpViewProps {
  onOpenCSimulator: () => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ onOpenCSimulator }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Academic Project Guide &amp; Technical Documentation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            "Smart Water Consumption Monitoring and Billing Simulator Using C"
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadCProjectZip()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-sky-300 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Download C Code (.zip)</span>
          </button>
          <button
            onClick={onOpenCSimulator}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Terminal className="w-4 h-4" />
            <span>Launch C Terminal</span>
          </button>
        </div>
      </div>

      {/* 7 Modules Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          {
            num: 'Module 1',
            title: 'User Management',
            file: 'consumer.c / consumer.h',
            desc: 'Household registration, auto-generated unique IDs (CON101, CON102), safe string parsing without buffer overflows, duplicate prevention, and persistent storage in consumers.txt.',
          },
          {
            num: 'Module 2',
            title: 'Consumption Monitoring',
            file: 'monitoring.c / monitoring.h',
            desc: 'Reading meter inputs, preventing negative consumption (Current >= Previous), calculating volume in Kilolitres and Litres (1 KL = 1,000 L), and writing to water_records.txt.',
          },
          {
            num: 'Module 3',
            title: 'Progressive Slab Tariff',
            file: 'billing.c / billing.h',
            desc: 'Equitable tiered pricing: 0–10 KL @ ₹5, 11–20 KL @ ₹8, 21–30 KL @ ₹12, >30 KL @ ₹15 plus fixed service fee (₹50) to reward conservation and penalise wastage.',
          },
          {
            num: 'Module 4',
            title: 'Bill Generation & Invoicing',
            file: 'billing.c / billing.h',
            desc: 'Professional audit-ready invoices with itemised breakdown of units per slab tier, service charge, due date, status, and file saving into bills.txt.',
          },
          {
            num: 'Module 5',
            title: 'Water Usage Analytics',
            file: 'analytics.c / analytics.h',
            desc: 'Monthly usage summation, average volume calculation, peak cycle identification, and terminal ASCII bar charts using proportional character rendering.',
          },
          {
            num: 'Module 6',
            title: 'Leakage & Excess Alerts',
            file: 'analytics.c / analytics.h',
            desc: 'Simulated heuristic anomaly detection comparing readings against a 30 KL threshold and overnight baseline trickle detection with conservation remediation advice.',
          },
        ].map((m) => (
          <div key={m.num} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase text-sky-600">{m.num}</span>
                <span className="font-mono text-[10px] text-slate-400">{m.file}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm mt-3">{m.title}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* GCC Compilation & Windows Setup */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-sky-600" />
          <span>How to Compile &amp; Run the C Code on Windows (Academic Submission)</span>
        </h3>
        <div className="p-4 bg-slate-900 rounded-2xl text-slate-300 font-mono text-xs space-y-2">
          <p className="text-slate-400"># 1. Unzip the downloaded SmartWaterBilling_C_Project.zip</p>
          <p className="text-slate-400"># 2. Open Command Prompt or VS Code Terminal in the directory</p>
          <p className="text-emerald-400">
            gcc -Wall -Wextra -std=c11 main.c consumer.c monitoring.c billing.c analytics.c payment.c file_manager.c -o smart_water_billing.exe
          </p>
          <p className="text-slate-400"># 3. Launch the console simulator executable</p>
          <p className="text-emerald-400">smart_water_billing.exe</p>
        </div>
      </div>
    </div>
  );
};
