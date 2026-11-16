import React, { useState } from 'react';
import { Receipt, Calculator, FileText, CheckCircle2, Clock, Eye, Printer, CreditCard } from 'lucide-react';
import { Bill, TariffConfig } from '../../types';
import { calculateProgressiveBilling } from '../../utils/billingCalculator';

interface BillingViewProps {
  bills: Bill[];
  tariff: TariffConfig;
  onViewInvoice: (bill: Bill) => void;
  onPayBill: (billId: string) => void;
  onOpenMeterModal: () => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  bills,
  tariff,
  onViewInvoice,
  onPayBill,
  onOpenMeterModal,
}) => {
  // Interactive test calculator
  const [testKL, setTestKL] = useState(25);
  const simCalc = calculateProgressiveBilling(testKL, tariff);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Module 3 &amp; 4: Progressive Slab Water Billing Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Calculated tariffs, itemised invoices &amp; records in <code className="font-mono text-sky-600">data/bills.txt</code>
          </p>
        </div>

        <button
          onClick={onOpenMeterModal}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Receipt className="w-4 h-4" />
          <span>Generate New Bill</span>
        </button>
      </div>

      {/* Interactive Progressive Slab Tariff Simulator (Module 3) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Module 3: Live Progressive Slab Calculator
            </h3>
            <p className="text-xs text-slate-500">
              Interactive test simulator verifying multi-tier pricing algorithm
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Input slider and quick presets */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Test Consumption: <span className="font-mono text-sky-600 text-sm font-extrabold">{testKL} KL</span>
            </label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={testKL}
              onChange={(e) => setTestKL(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex items-center gap-2 pt-1">
              {[8, 15, 25, 38, 45].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTestKL(preset)}
                  className={`px-2.5 py-1 text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer ${
                    testKL === preset ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset} KL
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Volume in Litres: {(testKL * 1000).toLocaleString()} L
            </p>
          </div>

          {/* Slabs calculation grid */}
          <div className="lg:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs">
            <div className="grid grid-cols-4 gap-2 text-center pb-3 border-b border-slate-200 text-[11px] font-bold text-slate-500">
              <div>Slab 1 (0-10 KL)</div>
              <div>Slab 2 (11-20 KL)</div>
              <div>Slab 3 (21-30 KL)</div>
              <div>Slab 4 (&gt;30 KL)</div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center pt-3 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">@ ₹{tariff.slab1Rate}/KL</span>
                <span className="text-xs font-bold text-slate-700">{simCalc.breakdown.slab1Units.toFixed(1)} KL</span>
                <span className="text-xs text-sky-700 font-bold block">₹{simCalc.breakdown.slab1Amount.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">@ ₹{tariff.slab2Rate}/KL</span>
                <span className="text-xs font-bold text-slate-700">{simCalc.breakdown.slab2Units.toFixed(1)} KL</span>
                <span className="text-xs text-sky-700 font-bold block">₹{simCalc.breakdown.slab2Amount.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">@ ₹{tariff.slab3Rate}/KL</span>
                <span className="text-xs font-bold text-slate-700">{simCalc.breakdown.slab3Units.toFixed(1)} KL</span>
                <span className="text-xs text-sky-700 font-bold block">₹{simCalc.breakdown.slab3Amount.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">@ ₹{tariff.slab4Rate}/KL</span>
                <span className="text-xs font-bold text-slate-700">{simCalc.breakdown.slab4Units.toFixed(1)} KL</span>
                <span className="text-xs text-sky-700 font-bold block">₹{simCalc.breakdown.slab4Amount.toFixed(0)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 text-xs">
              <span className="text-slate-600">
                Base Charges: ₹{simCalc.waterCharges.toFixed(2)} + Service Fee: ₹{tariff.fixedServiceCharge.toFixed(2)}
              </span>
              <span className="font-extrabold text-sm text-sky-800 font-mono">
                Total Bill: ₹{simCalc.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Invoices Table (Module 4) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">
            Saved Bills &amp; Invoices (<code className="font-mono text-xs">bills.txt</code>)
          </h3>
          <span className="text-xs text-slate-400">Total: {bills.length} invoices generated</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-6">Bill ID</th>
                <th className="py-3 px-4">Consumer</th>
                <th className="py-3 px-4">Billing Month</th>
                <th className="py-3 px-4 text-right">Volume (KL)</th>
                <th className="py-3 px-4 text-right">Water Charges</th>
                <th className="py-3 px-4 text-right">Total Payable</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {bills.map((b) => {
                const isPaid = b.paymentStatus === 'PAID';
                return (
                  <tr key={b.billID} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-800">{b.billID}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-700">
                      <div>
                        <span className="font-bold text-slate-800">{b.consumerName}</span>
                        <span className="text-slate-400 font-mono text-[10px] block">{b.consumerID}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-600">
                      {b.month} {b.year}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                      {b.consumptionKL.toFixed(2)} KL
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600">₹{b.waterCharges.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-sky-700 text-sm">
                      ₹{b.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewInvoice(b)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="View detailed invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        {!isPaid && (
                          <button
                            onClick={() => onPayBill(b.billID)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Settle bill"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>
                        )}
                      </div>
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
