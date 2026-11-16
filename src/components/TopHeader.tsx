import React, { useState } from 'react';
import { Search, Bell, ChevronDown, UserCheck, Plus, Terminal } from 'lucide-react';
import { Consumer } from '../types';

interface TopHeaderProps {
  currentConsumer: Consumer;
  allConsumers: Consumer[];
  onSelectConsumer: (consumer: Consumer) => void;
  onOpenRegisterModal: () => void;
  onOpenMeterModal: () => void;
  onOpenLeakageModal: () => void;
  onOpenCSimulator: () => void;
  unreadAlertCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentConsumer,
  allConsumers,
  onSelectConsumer,
  onOpenRegisterModal,
  onOpenMeterModal,
  onOpenLeakageModal,
  onOpenCSimulator,
  unreadAlertCount,
  searchQuery,
  onSearchChange,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 pt-1">
      {/* Welcome Greeting */}
      <div>
        <h1 className="text-2xl lg:text-[28px] font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <span>Welcome back, {currentConsumer.name.split(' ')[0]}</span>
          <span className="text-2xl" role="img" aria-label="sprout">🌾</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
          Let's use water consciously
        </p>
      </div>

      {/* Search Bar & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Search input with rounded pill styling */}
        <div className="relative w-48 sm:w-64 md:w-72 lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search or type a keyword"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white pl-11 pr-4 py-2 rounded-full text-xs sm:text-sm text-slate-700 placeholder-slate-400 border border-slate-200/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>

        {/* Notification Bell with Orange Dot */}
        <button
          onClick={onOpenLeakageModal}
          className="relative p-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600 shadow-xs transition-colors cursor-pointer shrink-0"
          title="View Leakage Alerts"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          {unreadAlertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-white"></span>
          )}
        </button>

        {/* User Profile Avatar with Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 p-1 pl-1 pr-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs transition-colors cursor-pointer"
          >
            <img
              src={currentConsumer.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
              alt={currentConsumer.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-sky-500/20"
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Switch Consumer Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Consumer</p>
                <p className="text-sm font-bold text-slate-800">{currentConsumer.name}</p>
                <p className="text-xs text-sky-600 font-mono">{currentConsumer.consumerID} • {currentConsumer.meterNumber}</p>
              </div>

              <div className="py-1">
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Household:
                </p>
                {allConsumers.map((c) => (
                  <button
                    key={c.consumerID}
                    onClick={() => {
                      onSelectConsumer(c);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-colors cursor-pointer ${
                      c.consumerID === currentConsumer.consumerID
                        ? 'bg-sky-50 text-sky-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px]">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.consumerID}</div>
                      </div>
                    </div>
                    {c.consumerID === currentConsumer.consumerID && (
                      <UserCheck className="w-4 h-4 text-sky-600" />
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenRegisterModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register New Household (Module 1)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
