import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, History, Receipt, Banknote, Smartphone, ShieldCheck } from 'lucide-react';
import { Bill, Payment } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  unpaidBills: Bill[];
  payments: Payment[];
  onProcessPayment: (billId: string, mode: 'Cash' | 'UPI' | 'Bank Card' | 'NetBanking') => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  unpaidBills,
  payments,
  onProcessPayment,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'pay' | 'history'>('pay');
  const [selectedBillId, setSelectedBillId] = useState(unpaidBills[0]?.billID || '');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Card' | 'NetBanking'>('UPI');
  const [justSettled, setJustSettled] = useState<Payment | null>(null);

  const selectedBill = unpaidBills.find((b) => b.billID === selectedBillId);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    onProcessPayment(selectedBill.billID, paymentMode);

    setJustSettled({
      paymentID: `PAY${Math.floor(300 + Math.random() * 600)}`,
      billID: selectedBill.billID,
      consumerID: selectedBill.consumerID,
      amountPaid: selectedBill.totalAmount,
      paymentMode,
      paymentDate: new Date().toISOString().split('T')[0],
      receiptNumber: `RCP-${Math.floor(100000 + Math.random() * 900000)}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Module 7: Payment Management</h3>
              <p className="text-xs text-slate-500 font-medium">Settle bills &amp; generate simulated receipts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mt-4 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('pay');
              setJustSettled(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'pay' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Settle Pending Bill ({unpaidBills.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Payment History ({payments.length})</span>
          </button>
        </div>

        {activeTab === 'pay' && (
          <div className="mt-4">
            {justSettled ? (
              <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-extrabold text-emerald-900">
                  Payment Processed Successfully!
                </h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Bill {justSettled.billID} has been settled on disk (<code className="font-mono">data/bills.txt</code>).
                </p>

                <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-100 text-xs text-left font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Receipt No:</span>
                    <span className="font-bold text-slate-800">{justSettled.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-bold text-slate-800">{justSettled.paymentID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consumer ID:</span>
                    <span className="font-bold text-slate-800">{justSettled.consumerID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Settled:</span>
                    <span className="font-bold text-emerald-600">₹{justSettled.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Method:</span>
                    <span className="font-bold text-slate-800">{justSettled.paymentMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-bold text-slate-800">{justSettled.paymentDate}</span>
                  </div>
                </div>

                <button
                  onClick={() => setJustSettled(null)}
                  className="mt-4 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer"
                >
                  Settle Another Bill
                </button>
              </div>
            ) : unpaidBills.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/70">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">All Bills Settled!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  There are no pending water invoices in the database.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePay} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Unpaid Bill
                  </label>
                  <select
                    value={selectedBillId}
                    onChange={(e) => setSelectedBillId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-mono font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    {unpaidBills.map((b) => (
                      <option key={b.billID} value={b.billID}>
                        {b.billID} - {b.consumerName} ({b.month} {b.year}) • ₹{b.totalAmount.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBill && (
                  <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Billed Household:</span>
                      <span className="font-bold text-slate-800">{selectedBill.consumerName} ({selectedBill.consumerID})</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Consumption:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {selectedBill.consumptionKL.toFixed(2)} KL ({selectedBill.consumptionLitres.toLocaleString()} L)
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Base Water Charges:</span>
                      <span className="font-mono font-bold">₹{selectedBill.waterCharges.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Fixed Service Fee:</span>
                      <span className="font-mono font-bold">₹{selectedBill.serviceCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-sky-200 text-slate-900 font-extrabold text-sm">
                      <span>Total Amount Payable:</span>
                      <span className="text-base text-sky-700 font-mono">₹{selectedBill.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Simulated Payment Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'UPI', label: 'UPI Smart Pay', icon: Smartphone },
                      { id: 'Cash', label: 'Cash at Counter', icon: Banknote },
                      { id: 'Bank Card', label: 'Credit / Debit Card', icon: CreditCard },
                      { id: 'NetBanking', label: 'NetBanking', icon: Receipt },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isChosen = paymentMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPaymentMode(mode.id as any)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                            isChosen
                              ? 'bg-sky-500 text-white border-sky-600 shadow-xs font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Settlement (₹{selectedBill?.totalAmount.toFixed(2)})</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="mt-4 overflow-x-auto max-h-72">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-left font-semibold">
                  <th className="py-2">Receipt</th>
                  <th className="py-2">Bill ID</th>
                  <th className="py-2">Consumer</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2">Mode</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {payments.map((p) => (
                  <tr key={p.paymentID}>
                    <td className="py-2 text-slate-800 font-bold">{p.receiptNumber}</td>
                    <td className="py-2 text-slate-600">{p.billID}</td>
                    <td className="py-2 text-slate-600">{p.consumerID}</td>
                    <td className="py-2 text-right text-emerald-600 font-bold">₹{p.amountPaid.toFixed(2)}</td>
                    <td className="py-2 text-slate-600 font-sans">{p.paymentMode}</td>
                    <td className="py-2 text-slate-400">{p.paymentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
