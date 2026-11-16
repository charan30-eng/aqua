import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Consumer } from '../../types';

interface RegisterConsumerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (consumer: Consumer) => void;
  existingConsumers: Consumer[];
}

export const RegisterConsumerModal: React.FC<RegisterConsumerModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  existingConsumers,
}) => {
  if (!isOpen) return null;

  // Next consumer ID
  const nextNumber = existingConsumers.reduce((max, c) => {
    const num = parseInt(c.consumerID.replace('CON', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 100) + 1;

  const [generatedId] = useState(`CON${nextNumber}`);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the consumer / household name.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter the physical residential address.');
      return;
    }
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit contact telephone number.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newConsumer: Consumer = {
      consumerID: generatedId,
      name: name.trim(),
      address: address.trim(),
      phoneNumber: cleanPhone,
      registrationDate: todayStr,
      meterNumber: `MTR-${Math.floor(1000 + Math.random() * 9000)}-DEL`,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    };

    onRegister(newConsumer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Module 1: Register Consumer</h3>
              <p className="text-xs text-slate-500">Add a new household to smart water metering</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Generated Consumer ID
            </label>
            <input
              type="text"
              readOnly
              value={generatedId}
              className="w-full bg-slate-100 border border-slate-200 text-slate-600 text-sm font-mono font-bold rounded-xl px-3.5 py-2.5 focus:outline-none cursor-not-allowed"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Auto-incremented primary key according to C data specification
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Household / Consumer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Anand Mahindra"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Residential Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Villa 45, Palm Avenue Sector 9"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setError(null);
              }}
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              10-Digit Contact Phone <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="e.g. 9812345678"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setError(null);
              }}
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm &amp; Register</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
