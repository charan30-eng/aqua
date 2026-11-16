import React, { useState } from 'react';
import { Receipt, Search, Eye, XCircle, PlusCircle } from 'lucide-react';
import { Bill } from '../../types';

interface AdminBillsViewProps {
  bills: Bill[];
  onViewInvoice: (bill: Bill) => void;
  onOpenMeterModal: () => void;
  onCancelBill: (billId: string, reason: string) => void;
}

export const AdminBillsView: React.FC<AdminBillsViewProps> = ({
  bills,
  onViewInvoice,
  onOpenMeterModal,
  onCancelBill,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBills = bills.filter((b) => {
    const matchesStatus = filterStatus === 'all' || b.paymentStatus.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      b.billID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.consumerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.consumerID.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCancelClick = (bill: Bill) => {
    if (bill.paymentStatus === 'PAID') {
      alert('Error 409: Immutable Record — Settled bills cannot be cancelled.');
      return;
    }
    const reason = prompt(`Enter cancellation audit reason for ${bill.billID}:`, 'Meter recalibration adjustment');
    if (reason && reason.trim()) {
      onCancelBill(bill.billID, reason.trim());
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Utility Billing &amp; Invoice Ledger
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Total {bills.length} generated utility invoices with immutable audit logging and itemized slab breakdown.
          </p>
        </div>

        <button
          onClick={onOpenMeterModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'paid', 'unpaid', 'overdue', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#0284c7] text-white font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {st} ({st === 'all' ? bills.length : bills.filter((b) => b.paymentStatus.toLowerCase() === st).length})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bill ID or consumer..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="pb-3 font-semibold">Bill ID</th>
              <th className="pb-3 font-semibold">Consumer</th>
              <th className="pb-3 font-semibold">Period</th>
              <th className="pb-3 font-semibold">Consumption (KL)</th>
              <th className="pb-3 font-semibold">Total Amount</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBills.map((b) => (
              <tr key={b.billID} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 font-mono font-bold text-sky-700">{b.billID}</td>
                <td className="py-3">
                  <div className="font-semibold text-slate-800">{b.consumerName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{b.consumerID}</div>
                </td>
                <td className="py-3 text-slate-600 font-medium">
                  {b.month} {b.year}
                  <div className="text-[10px] text-slate-400">Due: {b.dueDate}</div>
                </td>
                <td className="py-3 font-mono text-slate-700">{b.consumptionKL} KL</td>
                <td className="py-3 font-mono font-bold text-slate-900 text-sm">
                  ₹{b.totalAmount}.00
                </td>
                <td className="py-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      b.paymentStatus === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : b.paymentStatus === 'OVERDUE'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : b.paymentStatus === 'CANCELLED'
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {b.paymentStatus}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onViewInvoice(b)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 border border-slate-200"
                    >
                      <Eye className="w-3 h-3 text-sky-600" />
                      <span>Invoice</span>
                    </button>
                    {b.paymentStatus !== 'PAID' && b.paymentStatus !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelClick(b)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-rose-200 inline-flex items-center gap-1"
                        title="Cancel Bill"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
