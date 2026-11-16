import React, { useState } from 'react';
import { CreditCard, Search, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Payment, Bill, Consumer } from '../../types';

interface AdminPaymentsViewProps {
  payments: Payment[];
  bills: Bill[];
  consumers: Consumer[];
  onRecordPayment: (payment: Payment) => void;
}

export const AdminPaymentsView: React.FC<AdminPaymentsViewProps> = ({
  payments,
  bills,
  consumers,
  onRecordPayment,
}) => {
  const [filterMode, setFilterMode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal to record offline/admin payment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState(bills.find((b) => b.paymentStatus !== 'PAID')?.billID || '');
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('UPI');
  const [txnRef, setTxnRef] = useState('');

  const unpaidBills = bills.filter((b) => b.paymentStatus === 'UNPAID' || b.paymentStatus === 'OVERDUE');

  const filteredPayments = payments.filter((p) => {
    const matchesMode = filterMode === 'all' || p.paymentMode.toLowerCase() === filterMode.toLowerCase();
    const matchesSearch =
      p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.billID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.consumerID.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMode && matchesSearch;
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBill = bills.find((b) => b.billID === selectedBillId);
    if (!targetBill) return;

    const newPayment: Payment = {
      paymentID: `PAY${400 + payments.length + 1}`,
      billID: targetBill.billID,
      consumerID: targetBill.consumerID,
      amountPaid: targetBill.totalAmount,
      paymentMode: payMode,
      paymentDate: new Date().toISOString().split('T')[0],
      receiptNumber: `RCP-${Math.floor(100000 + Math.random() * 900000)}`,
      transactionRef: txnRef.trim() || `TXN-OFFLINE-${Date.now()}`,
      status: 'completed',
    };

    onRecordPayment(newPayment);
    setIsModalOpen(false);
    setTxnRef('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Payment Settlements &amp; Financial Reconciliation
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Total Verified Collections: <span className="text-emerald-600 font-mono font-bold">₹{totalCollected.toLocaleString()}.00</span> across UPI, Bank Transfers, and Cash counters.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={unpaidBills.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Settlement</span>
        </button>
      </div>

      {/* Filter and search */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'UPI', 'NetBanking', 'Cash', 'Bank Transfer'].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterMode === mode
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt # or Bill ID..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="pb-3 font-semibold">Receipt Number</th>
              <th className="pb-3 font-semibold">Bill ID</th>
              <th className="pb-3 font-semibold">Consumer</th>
              <th className="pb-3 font-semibold">Payment Method</th>
              <th className="pb-3 font-semibold">Settlement Date</th>
              <th className="pb-3 font-semibold">Amount Settled</th>
              <th className="pb-3 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPayments.map((p) => {
              const consumer = consumers.find((c) => c.consumerID === p.consumerID);
              return (
                <tr key={p.paymentID} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-mono font-bold text-emerald-600">{p.receiptNumber}</td>
                  <td className="py-3 font-mono text-slate-600">{p.billID}</td>
                  <td className="py-3">
                    <div className="font-semibold text-slate-800">{consumer ? consumer.name : p.consumerID}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{p.consumerID}</div>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                      {p.paymentMode}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 font-mono">{p.paymentDate}</td>
                  <td className="py-3 font-mono font-bold text-emerald-600 text-sm">
                    ₹{p.amountPaid}.00
                  </td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      SETTLED
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Record Offline Payment Settlement</h3>
            <p className="text-xs text-slate-500">
              Select an outstanding bill and record manual reconciliation into SQLite.
            </p>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Outstanding Bill</label>
                <select
                  value={selectedBillId}
                  onChange={(e) => setSelectedBillId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs p-2.5 rounded-xl border border-slate-200 focus:bg-white"
                >
                  {unpaidBills.map((b) => (
                    <option key={b.billID} value={b.billID}>
                      {b.billID} — {b.consumerName} (₹{b.totalAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as any)}
                  className="w-full bg-slate-50 text-slate-800 text-xs p-2.5 rounded-xl border border-slate-200 focus:bg-white"
                >
                  <option value="UPI">UPI Instant</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Cash">Cash at Counter</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  placeholder="e.g. UPI-9928192410"
                  className="w-full bg-slate-50 text-slate-800 text-xs p-2.5 rounded-xl border border-slate-200 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
