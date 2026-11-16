import React from 'react';
import {
  LayoutDashboard,
  Users,
  Gauge,
  Sliders,
  Receipt,
  CreditCard,
  ShieldCheck,
  Terminal,
  LogOut,
  Droplets,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react';

interface AdminSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCSimulator: () => void;
  onSwitchToCustomerPortal: () => void;
  onLogout: () => void;
  alertCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCSimulator,
  onSwitchToCustomerPortal,
  onLogout,
  alertCount,
}) => {
  const navItems = [
    { id: 'admin-dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'admin-consumers', label: 'Consumer Directory', icon: Users },
    { id: 'admin-meters', label: 'Meters & Telemetry', icon: Gauge },
    { id: 'admin-tariffs', label: 'Tariff & Slab Engine', icon: Sliders },
    { id: 'admin-bills', label: 'Billing & Invoices', icon: Receipt },
    { id: 'admin-payments', label: 'Payments & Settlement', icon: CreditCard },
    { id: 'admin-audit', label: 'Audit Trail & Security', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 shrink-0 bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#0c4a6e] text-white p-6 flex flex-col justify-between rounded-3xl shadow-xl min-h-[920px]">
      <div>
        {/* Brand Logo & Admin Badge */}
        <div className="flex items-center gap-3 px-2 py-2 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
            <Droplets className="w-6 h-6 text-white fill-white/80" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-wider font-mono text-white">AQUA</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/25 text-white border border-white/30">
                ADMIN
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-sky-100">
              Operations Control
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-sky-200/80">
            Administrative Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${isActive
                    ? 'bg-white/25 text-white font-bold shadow-xs backdrop-blur-md border border-white/20'
                    : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white stroke-[2.5]' : 'text-white/80'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'admin-dashboard' && alertCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 font-mono">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Interactive C Console Simulator & Code Tab */}
          <div className="pt-3">
            <button
              onClick={onOpenCSimulator}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer bg-white/15 text-white hover:bg-white/25 border border-white/25 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-sky-200" />
                <span className="font-semibold text-sky-50">C11 Backend &amp; Code</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-200 text-sky-950 font-bold uppercase">
                C11
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3 pt-5 border-t border-white/20">
        {/* Switch to Customer Portal button */}
        <button
          onClick={onSwitchToCustomerPortal}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-white/20 hover:bg-white/30 border border-white/25 transition-all cursor-pointer shadow-xs"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Switch to Customer Portal</span>
        </button>

        {/* Server & Engine Telemetry Status Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15 text-xs text-white">
          <div className="flex items-center justify-between font-semibold mb-1">
            <span className="text-white/90 text-[11px]">Utility Engine</span>
            <span className="flex items-center gap-1 text-emerald-300 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              C11 + SQLite
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-white/80">
            <span>Precision Mode</span>
            <span className="font-mono text-white font-bold">Integer Paise</span>
          </div>
          {alertCount > 0 && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/15 text-[10px] text-amber-200">
              <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0" />
              <span>{alertCount} high-consumption alerts</span>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white text-[#0284c7] font-semibold rounded-xl text-sm shadow-md hover:bg-sky-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#0284c7]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
