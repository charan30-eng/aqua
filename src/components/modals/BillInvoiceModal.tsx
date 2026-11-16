import React from 'react';
import { X, Printer, CheckCircle, FileText, Droplets, CreditCard } from 'lucide-react';
import { Bill } from '../../types';

interface BillInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  onPayBill: (billId: string) => void;
}

export const BillInvoiceModal: React.FC<BillInvoiceModalProps> = ({
  isOpen,
  onClose,
  bill,
  onPayBill,
}) => {
  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = bill.paymentStatus === 'PAID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 my-8">
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-sky-100 text-sky-800">
              Module 4: Water Bill Generation
            </span>
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              [{bill.paymentStatus}]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Print Invoice"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Card */}
        <div className="mt-4 p-6 bg-slate-50/50 rounded-2xl border border-slate-200/80 font-sans print:m-0 print:border-none print:bg-white">
          {/* Municipal Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center">
                <Droplets className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  AQUA SMART WATER UTILITY
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Municipal Smart Metering &amp; Progressive Tariff Authority
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Bill Number</div>
              <div className="text-lg font-mono font-bold text-sky-700">{bill.billID}</div>
              <div className="text-[11px] text-slate-500">Date: {bill.billDate}</div>
            </div>
          </div>

          {/* Consumer & Cycle Summary */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1">
                Consumer Information
              </p>
              <p className="font-bold text-slate-800 text-sm">{bill.consumerName}</p>
              <p className="text-slate-600 font-mono">Consumer ID: {bill.consumerID}</p>
              <p className="text-slate-500 mt-0.5">Billing Month: {bill.month} {bill.year}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1">
                Payment Due
              </p>
              <p className="font-bold text-slate-800 text-sm">{bill.dueDate}</p>
              <p className="text-slate-500 mt-1">Payment Method: Municipal Online / Module 8</p>
            </div>
          </div>

          {/* Meter Readings */}
          <div className="py-4 border-b border-slate-200">
            <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-2">
              Meter Reading Summary (KL)
            </p>
            <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded-xl border border-slate-200/60 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Previous Reading</span>
                <span className="text-sm font-bold text-slate-700">{bill.previousReading.toFixed(2)} KL</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Current Reading</span>
                <span className="text-sm font-bold text-slate-700">{bill.currentReading.toFixed(2)} KL</span>
              </div>
              <div className="bg-sky-50 rounded-lg p-1">
                <span className="text-[10px] text-sky-700 block font-sans font-bold">Total Consumption</span>
                <span className="text-base font-extrabold text-sky-800">
                  {bill.consumptionKL.toFixed(2)} KL
                </span>
                <span className="text-[10px] text-slate-500 block font-sans">
                  ({bill.consumptionLitres.toLocaleString()} Litres)
                </span>
              </div>
            </div>
          </div>

          {/* Progressive Slab Breakdown Table (Module 3) */}
          <div className="py-4 border-b border-slate-200">
            <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-2">
              Progressive Slab Calculation Breakdown
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-left font-semibold">
                  <th className="py-1.5">Tariff Slab Tier</th>
                  <th className="py-1.5 text-center">Rate / KL</th>
                  <th className="py-1.5 text-center">Billed Units</th>
                  <th className="py-1.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2 text-slate-700 font-sans font-medium">Slab 1 (0 – 10 KL)</td>
                  <td className="py-2 text-center text-slate-600">₹{bill.breakdown.slab1Rate.toFixed(2)}</td>
                  <td className="py-2 text-center text-slate-700">{bill.breakdown.slab1Units.toFixed(2)} KL</td>
                  <td className="py-2 text-right text-slate-800 font-bold">₹{bill.breakdown.slab1Amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-700 font-sans font-medium">Slab 2 (11 – 20 KL)</td>
                  <td className="py-2 text-center text-slate-600">₹{bill.breakdown.slab2Rate.toFixed(2)}</td>
                  <td className="py-2 text-center text-slate-700">{bill.breakdown.slab2Units.toFixed(2)} KL</td>
                  <td className="py-2 text-right text-slate-800 font-bold">₹{bill.breakdown.slab2Amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-700 font-sans font-medium">Slab 3 (21 – 30 KL)</td>
                  <td className="py-2 text-center text-slate-600">₹{bill.breakdown.slab3Rate.toFixed(2)}</td>
                  <td className="py-2 text-center text-slate-700">{bill.breakdown.slab3Units.toFixed(2)} KL</td>
                  <td className="py-2 text-right text-slate-800 font-bold">₹{bill.breakdown.slab3Amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-700 font-sans font-medium">Slab 4 (Above 30 KL)</td>
                  <td className="py-2 text-center text-slate-600">₹{bill.breakdown.slab4Rate.toFixed(2)}</td>
                  <td className="py-2 text-center text-slate-700">{bill.breakdown.slab4Units.toFixed(2)} KL</td>
                  <td className="py-2 text-right text-slate-800 font-bold">₹{bill.breakdown.slab4Amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Final Financial Totals */}
          <div className="pt-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Base Progressive Water Charges:</span>
              <span className="font-mono font-bold">₹{bill.waterCharges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Fixed Service &amp; Maintenance Charge:</span>
              <span className="font-mono font-bold">₹{bill.serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-300 text-base font-extrabold text-slate-900">
              <span>FINAL PAYABLE AMOUNT:</span>
              <span className="font-mono text-xl text-sky-700">₹{bill.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-4 no-print">
          <p className="text-xs text-slate-400">
            Stored in <code className="font-mono text-slate-600">data/bills.txt</code>
          </p>

          <div className="flex items-center gap-3">
            {!isPaid ? (
              <button
                onClick={() => {
                  onPayBill(bill.billID);
                  onClose();
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Settle Bill (Mark as Paid)</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Bill Settled on Record</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
