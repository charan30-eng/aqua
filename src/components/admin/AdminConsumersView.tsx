import React, { useState } from 'react';
import { Users, Search, PlusCircle, Phone, MapPin, Gauge } from 'lucide-react';
import { Consumer } from '../../types';

interface AdminConsumersViewProps {
  consumers: Consumer[];
  onOpenRegisterModal: () => void;
  onRecordReadingForConsumer: (consumer: Consumer) => void;
}

export const AdminConsumersView: React.FC<AdminConsumersViewProps> = ({
  consumers,
  onOpenRegisterModal,
  onRecordReadingForConsumer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConsumers = consumers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.consumerID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Consumer Directory &amp; Account Management
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Total {consumers.length} registered municipal and institutional water utility consumers.
          </p>
        </div>

        <button
          onClick={onOpenRegisterModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Consumer</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, Consumer ID, phone, or address..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>
      </div>

      {/* Consumers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredConsumers.map((c) => (
          <div
            key={c.consumerID}
            className="bg-white border border-slate-100/90 hover:border-slate-200 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm border border-sky-100">
                    {c.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{c.name}</h3>
                    <span className="font-mono text-xs text-sky-700 font-bold">{c.consumerID}</span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{c.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{c.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="font-mono text-sky-800 font-semibold">{c.meterNumber || 'MTR-PENDING'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">Reg: {c.registrationDate}</span>
              <button
                onClick={() => onRecordReadingForConsumer(c)}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-sky-600 hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-slate-200"
              >
                Record Reading
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
