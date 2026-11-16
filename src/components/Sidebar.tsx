import React from 'react';
import {
  LayoutDashboard,
  User,
  BarChart3,
  Receipt,
  Settings,
  HelpCircle,
  Terminal,
  LogOut,
  Droplets,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCSimulator: () => void;
  onSwitchToAdminPortal?: () => void;
  onLogout: () => void;
  unreadAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCSimulator,
  onSwitchToAdminPortal,
  onLogout,
  unreadAlertCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'track-usage', label: 'Track Usage', icon: BarChart3 },
    { id: 'billing', label: 'Billing & Slabs', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & FAQs', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 shrink-0 bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] text-white p-6 flex flex-col justify-between rounded-3xl shadow-xl min-h-[920px]">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-3 py-2 mb-10">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
            <Droplets className="w-6 h-6 text-white fill-white/80" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-wider font-mono text-white">AQUA</span>
            <span className="text-[10px] block text-sky-100 font-semibold">Customer Portal</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${isActive
                    ? 'bg-white/25 text-white font-semibold shadow-sm backdrop-blur-md'
                    : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white stroke-[2.5]' : 'text-white/80'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Interactive C Console Simulator & Code Tab */}
          <button
            onClick={onOpenCSimulator}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer bg-white/15 text-white hover:bg-white/25 mt-4 border border-white/25 shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <Terminal className="w-5 h-5 text-sky-200" />
              <span className="font-semibold text-sky-50">C Terminal &amp; Code</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-300 text-sky-950 font-bold uppercase">
              C11
            </span>
          </button>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3 pt-6 border-t border-white/15">
        {/* Switch to Admin Portal Button */}
        {onSwitchToAdminPortal && (
          <button
            onClick={onSwitchToAdminPortal}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0B1F3A]/90 hover:bg-[#0B1F3A] text-cyan-300 font-bold rounded-xl text-xs shadow-md border border-cyan-400/30 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Switch to Admin Portal</span>
          </button>
        )}

        {/* Quick status pill */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15 text-xs">
          <div className="flex items-center justify-between text-white/90 font-medium mb-1">
            <span>Meter Status</span>
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-white/70 text-[11px]">
            {unreadAlertCount > 0 ? (
              <span className="text-amber-300 font-semibold">{unreadAlertCount} simulated leak alert!</span>
            ) : (
              'Pressure & flow nominal'
            )}
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white text-[#0284c7] font-semibold rounded-xl text-sm shadow-md hover:bg-sky-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#0284c7]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
