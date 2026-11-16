import React, { useState } from 'react';
import { User, Plus, Search, MapPin, Phone, Calendar, Gauge } from 'lucide-react';
import { Consumer } from '../../types';

interface ConsumersViewProps {
  consumers: Consumer[];
  onOpenRegisterModal: () => void;
  onSelectConsumer: (consumer: Consumer) => void;
  onRecordReadingForConsumer: (consumer: Consumer) => void;
}

export const ConsumersView: React.FC<ConsumersViewProps> = ({
  consumers,
  onOpenRegisterModal,
  onSelectConsumer,
  onRecordReadingForConsumer,
}) => {
  const [search, setSearch] = useState('');

  const filtered = consumers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.consumerID.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Module 1: Household Consumer Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registered residential consumers, smart meter IDs &amp; records in <code className="font-mono text-sky-600">data/consumers.txt</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <button
            onClick={onOpenRegisterModal}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Household</span>
          </button>
        </div>
      </div>

      {/* Consumer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((c) => (
          <div
            key={c.consumerID}
            className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={c.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={c.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-sky-100"
                  />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{c.name}</h3>
                    <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                      {c.consumerID}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{c.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{c.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Joined: {c.registrationDate}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
              <button
                onClick={() => onSelectConsumer(c)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Set as Active
              </button>
              <button
                onClick={() => onRecordReadingForConsumer(c)}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <Gauge className="w-3 h-3 text-sky-600" />
                <span>Meter Reading</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
