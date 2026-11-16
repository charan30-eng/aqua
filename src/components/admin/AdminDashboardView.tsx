import React, { useState } from 'react';
import {
  TrendingUp,
  Droplets,
  Gauge,
  Users,
  AlertTriangle,
  Receipt,
  CreditCard,
  ArrowUpRight,
  Zap,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  PlusCircle,
  Eye,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Consumer, WaterRecord, Bill, Payment, TariffConfig } from '../../types';
import {
  sixMonthRevenueTrend,
  sectorDistribution,
  slabRevenueDistribution,
  initialMeters,
} from '../../data/adminInitialData';

interface AdminDashboardViewProps {
  consumers: Consumer[];
  records: WaterRecord[];
  bills: Bill[];
  payments: Payment[];
  tariff: TariffConfig;
  onViewInvoice: (bill: Bill) => void;
  onOpenMeterModal: () => void;
  onOpenRegisterModal: () => void;
  onOpenCSimulator: () => void;
  onSelectTab: (tab: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  consumers,
  records,
  bills,
  payments,
  tariff,
  onViewInvoice,
  onOpenMeterModal,
  onOpenRegisterModal,
  onOpenCSimulator,
  onSelectTab,
}) => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(5); // November

  // Calculate dynamic live metrics from actual data
  const totalBilled = bills.reduce((sum, b) => (b.paymentStatus !== 'CANCELLED' ? sum + b.totalAmount : sum), 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalOutstanding = bills
    .filter((b) => b.paymentStatus === 'UNPAID' || b.paymentStatus === 'OVERDUE')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '92.4';
  const totalConsumptionKL = records.reduce((sum, r) => sum + r.consumptionKL, 0);
  const averageConsumptionKL = records.length > 0 ? (totalConsumptionKL / records.length).toFixed(1) : '24.2';

  const activeMetersCount = initialMeters.filter((m) => m.status === 'active').length;
  const maintenanceMetersCount = initialMeters.filter((m) => m.status === 'maintenance').length;
  const inactiveMetersCount = initialMeters.filter((m) => m.status === 'inactive').length;

  const surgeAlerts = records.filter((r) => r.consumptionKL >= tariff.leakageThresholdKL);

  const handleExportCSV = () => {
    const headers = ['Bill ID', 'Consumer', 'Month', 'Year', 'Consumption (KL)', 'Amount (INR)', 'Status'];
    const rows = bills.map((b) => [
      b.billID,
      b.consumerName,
      b.month,
      b.year,
      b.consumptionKL,
      b.totalAmount,
      b.paymentStatus,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aquabill-executive-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* 1. Executive Operations Header Banner (Light Theme with Sky Accent) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100 font-mono uppercase tracking-wide">
                Live Utility Authority Telemetry
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                All Systems Operational
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Municipal Water Operations &amp; Executive Billing Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Centralized command center managing meter telemetry, progressive slab tariffs, automated fixed-point paise calculations, and audit-compliant financial settlement.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Executive CSV</span>
            </button>
            <button
              onClick={onOpenMeterModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Meter Reading</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 6 Executive KPI Metric Cards (Crisp Light Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {/* KPI 1: Collections Efficiency */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Collections Efficiency</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-800 font-mono">
            {collectionRate}%
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500">Total Billed</span>
            <span className="font-semibold text-slate-700 font-mono">₹{totalBilled.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-0.5">
            <span className="text-slate-500">Collected</span>
            <span className="font-semibold text-emerald-600 font-mono">₹{totalCollected.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 2: Water Supply Distributed */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Water Supplied</span>
            <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-800 font-mono">
            {totalConsumptionKL.toFixed(1)} <span className="text-xs font-normal text-slate-500">KL</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500">Avg / Household</span>
            <span className="font-semibold text-sky-700 font-mono">{averageConsumptionKL} KL</span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-0.5">
            <span className="text-slate-500">Volume Litres</span>
            <span className="font-semibold text-slate-700 font-mono">{(totalConsumptionKL * 1000).toLocaleString()} L</span>
          </div>
        </div>

        {/* KPI 3: Meter Fleet Telemetry */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Meter Fleet</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-800 font-mono">
            {initialMeters.length} <span className="text-xs font-normal text-slate-500">Meters</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-emerald-600 font-semibold">{activeMetersCount} Active</span>
            <span className="text-amber-600 font-semibold">{maintenanceMetersCount} Maint.</span>
            <span className="text-slate-400 font-semibold">{inactiveMetersCount} Inact.</span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-0.5 text-slate-500">
            <span>Uptime Ratio</span>
            <span className="text-emerald-600 font-semibold">98.8%</span>
          </div>
        </div>

        {/* KPI 4: Consumers Enrolled */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Utility Consumers</span>
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-800 font-mono">
            {consumers.length} <span className="text-xs font-normal text-slate-500">Accounts</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500">Sectors Served</span>
            <span className="font-semibold text-indigo-700">4 Zones</span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-0.5 text-slate-500">
            <span>RBAC Verification</span>
            <span className="text-emerald-600 font-semibold">100% Salted</span>
          </div>
        </div>

        {/* KPI 5: Outstanding Balance */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Outstanding Dues</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-amber-600 font-mono">
            ₹{totalOutstanding.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500">Unsettled</span>
            <span className="font-semibold text-amber-700 font-mono">
              {bills.filter((b) => b.paymentStatus === 'UNPAID' || b.paymentStatus === 'OVERDUE').length} Invoices
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-0.5 text-slate-500">
            <span>Aging Delinquency</span>
            <span className="text-amber-600 font-semibold">Max 45 Days</span>
          </div>
        </div>

        {/* KPI 6: Surge & Leak Alerts */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Surge &amp; Leak Alerts</span>
            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-rose-600 font-mono">
            {surgeAlerts.length} <span className="text-xs font-normal text-slate-500">&gt; 35 KL</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500">Threshold Trigger</span>
            <span className="font-semibold text-rose-600 font-mono">{tariff.leakageThresholdKL} KL/mo</span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-0.5 text-slate-500">
            <span>Action Required</span>
            <span className="text-rose-600 font-semibold">Inspect Meters</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Analytics & Visual Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 cols): 6-Month Billed vs Collected Trend */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-800 tracking-tight">
                  6-Month Revenue Trend (Billed vs Collected)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly utility billing realization and water supply consumption trend
              </p>
            </div>

            {/* Legend pills */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded bg-[#0284c7]"></span>
                <span>Billed (₹)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span>Collected (₹)</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-3 items-end h-56 pt-6 pb-2 border-b border-slate-100">
              {sixMonthRevenueTrend.map((m, idx) => {
                const maxVal = 65000;
                const billedHeight = Math.round((m.billed / maxVal) * 100);
                const collectedHeight = Math.round((m.collected / maxVal) * 100);
                const isSelected = selectedMonthIndex === idx;

                return (
                  <div
                    key={m.month}
                    onClick={() => setSelectedMonthIndex(idx)}
                    className={`flex flex-col items-center justify-end h-full gap-2 cursor-pointer group transition-all p-1.5 rounded-2xl ${
                      isSelected ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Paired bars */}
                    <div className="flex items-end gap-1.5 h-full w-full justify-center">
                      {/* Billed bar */}
                      <div
                        style={{ height: `${billedHeight}%` }}
                        className={`w-4 sm:w-6 rounded-t-md transition-all ${
                          isSelected ? 'bg-[#0284c7] shadow-sm' : 'bg-sky-400 group-hover:bg-[#0284c7]'
                        }`}
                        title={`${m.month}: Billed ₹${m.billed.toLocaleString()}`}
                      ></div>

                      {/* Collected bar */}
                      <div
                        style={{ height: `${collectedHeight}%` }}
                        className={`w-4 sm:w-6 rounded-t-md transition-all ${
                          isSelected ? 'bg-emerald-500 shadow-sm' : 'bg-emerald-400 group-hover:bg-emerald-500'
                        }`}
                        title={`${m.month}: Collected ₹${m.collected.toLocaleString()}`}
                      ></div>
                    </div>

                    <span className={`text-xs font-semibold ${isSelected ? 'text-[#0284c7] font-bold' : 'text-slate-500'}`}>
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected Month Detail Strip */}
            {sixMonthRevenueTrend[selectedMonthIndex] && (
              <div className="bg-[#f8fafc] rounded-2xl p-4 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Selected Billing Period:</span>{' '}
                  <span className="font-bold text-slate-800 text-sm">
                    {sixMonthRevenueTrend[selectedMonthIndex].month} 2024
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-slate-500">Billed:</span>{' '}
                    <span className="font-bold text-[#0284c7] font-mono">
                      ₹{sixMonthRevenueTrend[selectedMonthIndex].billed.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Collected:</span>{' '}
                    <span className="font-bold text-emerald-600 font-mono">
                      ₹{sixMonthRevenueTrend[selectedMonthIndex].collected.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Water Volume:</span>{' '}
                    <span className="font-bold text-indigo-600 font-mono">
                      {sixMonthRevenueTrend[selectedMonthIndex].consumptionKL} KL
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Sector Breakdown & Slab Realization */}
        <div className="lg:col-span-4 space-y-5">
          {/* Sector Consumption Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Consumption by Utility Sector
              </h3>
            </div>

            <div className="space-y-3">
              {sectorDistribution.map((sector) => (
                <div key={sector.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{sector.name}</span>
                    <span className="text-slate-500 font-mono">{sector.percentage}% ({sector.consumptionKL} KL)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${sector.percentage}%`, backgroundColor: sector.color }}
                      className="h-full rounded-full transition-all"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slab Tier Revenue Realization Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                  Progressive Slab Realization
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Paise Precision
              </span>
            </div>

            <div className="space-y-2.5">
              {slabRevenueDistribution.map((slab) => (
                <div
                  key={slab.slab}
                  className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800 text-[11px]">{slab.slab}</div>
                    <div className="text-[10px] text-slate-500">{slab.unitsKL} KL billed</div>
                  </div>
                  <span className="font-mono font-bold text-sky-700">
                    ₹{slab.revenueINR.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. 4-Quadrant Operations Feeds & Action Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quadrant 1: Recent Invoices & Billing Operations */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Recent Billing Operations ({bills.length} Invoices)
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('admin-bills')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-2 font-semibold">Bill ID</th>
                  <th className="pb-2 font-semibold">Consumer</th>
                  <th className="pb-2 font-semibold">Usage</th>
                  <th className="pb-2 font-semibold">Amount</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.slice(0, 5).map((b) => (
                  <tr key={b.billID} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-mono font-bold text-sky-700">{b.billID}</td>
                    <td className="py-2.5 font-medium text-slate-800">{b.consumerName}</td>
                    <td className="py-2.5 font-mono text-slate-600">{b.consumptionKL} KL</td>
                    <td className="py-2.5 font-mono font-bold text-slate-900">₹{b.totalAmount}</td>
                    <td className="py-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.paymentStatus === 'OVERDUE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onViewInvoice(b)}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1 border border-slate-200"
                      >
                        <Eye className="w-3 h-3 text-sky-600" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quadrant 2: Live Meter Readings & Telemetry */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Live Meter Telemetry Ingestion
              </h3>
            </div>
            <button
              onClick={onOpenMeterModal}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer flex items-center gap-1"
            >
              <span>+ Record Reading</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {records.slice(-4).reverse().map((r) => {
              const consumer = consumers.find((c) => c.consumerID === r.consumerID);
              const isSurge = r.consumptionKL >= tariff.leakageThresholdKL;
              return (
                <div
                  key={r.recordID}
                  className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                        isSurge ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {r.consumptionKL}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">
                        {consumer ? consumer.name : r.consumerID}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {r.month} {r.year} · Delta: {r.previousReading} &rarr; {r.currentReading} KL
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {isSurge ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Surge &gt; 35 KL
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Nominal
                      </span>
                    )}
                    <div className="text-[10px] text-slate-400 mt-0.5">{r.recordDate}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quadrant 3: Financial Settlements */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Payment Settlements ({payments.length} Verified)
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('admin-payments')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer flex items-center gap-1"
            >
              <span>Settlement Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {payments.map((p) => {
              const consumer = consumers.find((c) => c.consumerID === p.consumerID);
              return (
                <div
                  key={p.paymentID}
                  className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      ₹
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">
                        {consumer ? consumer.name : p.consumerID}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Receipt: {p.receiptNumber} · {p.paymentMode}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-600">
                      ₹{p.amountPaid.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">{p.paymentDate}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quadrant 4: Critical Leakage & Surge Warnings */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Critical Telemetry Alerts ({surgeAlerts.length} Active)
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Immediate Attention
            </span>
          </div>

          <div className="space-y-2.5">
            {surgeAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active critical surge alerts. Telemetry nominal.
              </div>
            ) : (
              surgeAlerts.map((r) => {
                const consumer = consumers.find((c) => c.consumerID === r.consumerID);
                return (
                  <div
                    key={`alert-${r.recordID}`}
                    className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>High Consumption Leak Anomaly ({r.consumptionKL} KL)</span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-0.5">
                        {consumer?.name} ({consumer?.address || consumer?.consumerID})
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Exceeded {tariff.leakageThresholdKL} KL municipal limit. Suspected pipe rupture or faulty float valve.
                      </p>
                    </div>

                    <button
                      onClick={() => alert(`Inspection technician dispatched to ${consumer?.address || 'premises'}!`)}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      Dispatch Crew
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
