import React from 'react';
import {
  Search,
  Bell,
  PlusCircle,
  Terminal,
  Droplet,
} from 'lucide-react';
import { AdminUser } from '../../types';

interface AdminTopHeaderProps {
  adminUser: AdminUser;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenRegisterModal: () => void;
  onOpenMeterModal: () => void;
  onOpenCSimulator: () => void;
  alertCount: number;
}

export const AdminTopHeader: React.FC<AdminTopHeaderProps> = ({
  adminUser,
  searchQuery,
  onSearchChange,
  onOpenRegisterModal,
  onOpenMeterModal,
  onOpenCSimulator,
  alertCount,
}) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 pt-1">
      {/* Left: Title & Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search consumer, meter ID (e.g. MTR-8821), or bill..."
          className="w-full bg-white pl-11 pr-4 py-2 rounded-full text-xs sm:text-sm text-slate-700 placeholder-slate-400 border border-slate-200/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
        />
      </div>

      {/* Right: Actions, Alerts & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
        {/* Quick Action: Record Meter Reading */}
        <button
          onClick={onOpenMeterModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Droplet className="w-3.5 h-3.5" />
          <span>Record Reading</span>
        </button>

        {/* Quick Action: Register Consumer */}
        <button
          onClick={onOpenRegisterModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
          <span>Add Consumer</span>
        </button>

        {/* Code / C Terminal Simulator Shortcut */}
        <button
          onClick={onOpenCSimulator}
          title="Open C11 Console Simulator"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-mono font-bold shadow-xs transition-all cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-sky-600" />
          <span>C11 Terminal</span>
        </button>

        {/* Telemetry Alert Bell */}
        <div className="relative">
          <button
            className="p-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600 shadow-xs transition-colors cursor-pointer"
            title="Telemetry Alerts"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Admin Profile Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <img
            src={adminUser.avatarUrl}
            alt={adminUser.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-500/20 shadow-xs"
          />
          <div className="text-left hidden lg:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">{adminUser.name}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-700 font-bold uppercase">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">{adminUser.title}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
