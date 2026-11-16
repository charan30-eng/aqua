import React, { useState } from 'react';
import {
  Droplets,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  UserPlus,
  Terminal,
  MapPin,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Consumer, AdminUser } from '../types';
import { defaultAdminUser } from '../data/adminInitialData';
import {
  authenticateConsumer,
  validateRegistrationInput,
  generateNextConsumerID,
} from '../utils/auth';

interface LoginPageProps {
  consumers: Consumer[];
  onLoginSuccess: (consumer: Consumer, rememberSession: boolean) => void;
  onRegisterSuccess: (newConsumer: Consumer, rememberSession: boolean) => void;
  onAdminLoginSuccess?: (adminUser: AdminUser) => void;
  onOpenCSimulator: () => void;
  initialRole?: 'customer' | 'admin';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  consumers,
  onLoginSuccess,
  onRegisterSuccess,
  onAdminLoginSuccess,
  onOpenCSimulator,
  initialRole = 'customer',
}) => {
  const [portalRole, setPortalRole] = useState<'customer' | 'admin'>(initialRole);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Customer Sign-in form state
  const [identifier, setIdentifier] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Sign-in form state
  const [adminEmail, setAdminEmail] = useState('admin@aquabill.local');
  const [adminPassword, setAdminPassword] = useState('Admin@1234');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Customer Registration form state
  const [regName, setRegName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');
  const [showRegPin, setShowRegPin] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const nextConsumerId = generateNextConsumerID(consumers);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = authenticateConsumer(consumers, identifier, passcode);
    if (!result.success || !result.consumer) {
      setLoginError(result.error || 'Authentication failed.');
      return;
    }
    setLoginError(null);
    onLoginSuccess(result.consumer, rememberSession);
  };

  const handleQuickDemoLogin = (consumer: Consumer) => {
    setLoginError(null);
    onLoginSuccess(consumer, rememberSession);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAdminError('Please provide both administrator email and password.');
      return;
    }

    // Default demo credentials or any authorized admin email
    if (
      (adminEmail.toLowerCase() === 'admin@aquabill.local' && adminPassword === 'Admin@1234') ||
      adminEmail.toLowerCase() === 'admin'
    ) {
      setAdminError(null);
      if (onAdminLoginSuccess) {
        onAdminLoginSuccess(defaultAdminUser);
      }
    } else {
      setAdminError('Invalid administrator credentials. For academic demo use: admin@aquabill.local / Admin@1234');
    }
  };

  const handleQuickAdminDemo = () => {
    setAdminError(null);
    if (onAdminLoginSuccess) {
      onAdminLoginSuccess(defaultAdminUser);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateRegistrationInput({
      name: regName,
      address: regAddress,
      phoneNumber: regPhone,
      pin: regPin,
    });

    if (!validation.valid || !validation.cleanPhone) {
      setRegError(validation.error || 'Please verify all registration fields.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newConsumer: Consumer = {
      consumerID: nextConsumerId,
      name: regName.trim(),
      address: regAddress.trim(),
      phoneNumber: validation.cleanPhone,
      registrationDate: todayStr,
      meterNumber: `MTR-${Math.floor(1000 + Math.random() * 9000)}-DEL`,
    };

    setRegError(null);
    onRegisterSuccess(newConsumer, true);
  };

  const demoHouseholds = consumers.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#edf3f8] text-slate-800 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-[1160px] bg-white rounded-[32px] p-3 sm:p-4 shadow-2xl border border-white/90 grid grid-cols-1 lg:grid-cols-12 items-stretch gap-4">
        {/* Left Brand Panel: Shifts between Customer (Sky Blue) and Admin (Dark Navy) */}
        {portalRole === 'customer' ? (
          <section className="order-2 lg:order-1 lg:col-span-5 bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between lg:min-h-[580px] transition-all">
            <div>
              {/* Brand Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
                  <Droplets className="w-6 h-6 text-white fill-white/80" />
                </div>
                <span className="text-2xl font-bold tracking-wider font-mono text-white">AQUA</span>
              </div>

              {/* Hero Copy */}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-balance">
                Smart water monitoring and billing portal.
              </h1>
              <p className="text-sky-50/90 text-sm sm:text-[15px] leading-relaxed mt-4 max-w-md">
                Monitor household meter consumption in kilolitres and litres, inspect progressive slab bills, and catch simulated pipeline leaks early.
              </p>

              {/* Clean Tariff Reference List */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <h2 className="text-xs font-semibold text-sky-100 tracking-wide mb-3">
                  Progressive Domestic Tariff Schedule
                </h2>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between text-white/95">
                    <dt className="text-sky-50/85">Tier 1 (0 – 10 KL)</dt>
                    <dd className="font-mono tabular-nums font-semibold">₹5.00 / KL</dd>
                  </div>
                  <div className="flex items-center justify-between text-white/95">
                    <dt className="text-sky-50/85">Tier 2 (11 – 20 KL)</dt>
                    <dd className="font-mono tabular-nums font-semibold">₹8.00 / KL</dd>
                  </div>
                  <div className="flex items-center justify-between text-white/95">
                    <dt className="text-sky-50/85">Tier 3 (21 – 30 KL)</dt>
                    <dd className="font-mono tabular-nums font-semibold">₹12.00 / KL</dd>
                  </div>
                  <div className="flex items-center justify-between text-white/95">
                    <dt className="text-sky-50/85">Tier 4 (Above 30 KL)</dt>
                    <dd className="font-mono tabular-nums font-semibold">₹15.00 / KL</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Bottom C Simulator Action */}
            <div className="pt-6 mt-6 border-t border-white/20 flex flex-col gap-3">
              <button
                type="button"
                onClick={onOpenCSimulator}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Terminal className="w-4 h-4 text-sky-100 shrink-0" />
                  <span className="truncate">Open C11 Console &amp; Code</span>
                </span>
                <ArrowRight className="w-4 h-4 text-sky-100 shrink-0 ml-2" />
              </button>
              <p className="text-xs text-sky-100/80">
                Offline academic simulation · Municipal Utility Portal
              </p>
            </div>
          </section>
        ) : (
          <section className="order-2 lg:order-1 lg:col-span-5 bg-gradient-to-b from-[#1e40af] via-[#0284c7] to-[#0369a1] text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between lg:min-h-[580px] transition-all shadow-xl">
            <div>
              {/* Brand Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
                  <Droplets className="w-6 h-6 text-white fill-white/80" />
                </div>
                <div>
                  <span className="text-2xl font-bold tracking-wider font-mono text-white">AQUA</span>
                  <span className="text-[10px] ml-2 font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                    UTILITY ADMIN
                  </span>
                </div>
              </div>

              {/* Hero Copy */}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Municipal Water Operations &amp; Billing Control Center
              </h1>
              <p className="text-sky-50/90 text-sm leading-relaxed mt-4 max-w-md">
                Centralized authority console for multi-meter telemetry ingestion, fixed-point paise calculations, tariff schedule administration, and audit reconciliation.
              </p>

              {/* Utility Feature Highlights */}
              <div className="mt-8 pt-6 border-t border-white/20 space-y-3 text-xs">
                <div className="flex items-center gap-3 text-white/95">
                  <CheckCircle2 className="w-4 h-4 text-sky-200 shrink-0" />
                  <span><strong>100% Integer Paise</strong> precision arithmetic (No float rounding)</span>
                </div>
                <div className="flex items-center gap-3 text-white/95">
                  <Gauge className="w-4 h-4 text-sky-200 shrink-0" />
                  <span><strong>18 Water Meters</strong> across residential, campus &amp; commercial zones</span>
                </div>
                <div className="flex items-center gap-3 text-white/95">
                  <Sliders className="w-4 h-4 text-sky-200 shrink-0" />
                  <span><strong>4 Tariff Schedules</strong> (Flat &amp; Progressive Slabs + Tax BPS)</span>
                </div>
                <div className="flex items-center gap-3 text-white/95">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span><strong>Role-Based Access Control</strong> with PBKDF2-HMAC-SHA256 sessions</span>
                </div>
              </div>
            </div>

            {/* Bottom C Simulator Action */}
            <div className="pt-6 mt-6 border-t border-white/20 flex flex-col gap-3">
              <button
                type="button"
                onClick={onOpenCSimulator}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-sky-100 shrink-0" />
                  <span>Inspect C11 Engine &amp; Mongoose REST</span>
                </span>
                <ArrowRight className="w-4 h-4 text-sky-100 shrink-0 ml-2" />
              </button>
              <p className="text-xs text-sky-100/80">
                Executive Security Level · Chief Water Works Engineer
              </p>
            </div>
          </section>
        )}

        {/* Right Authentication Form Panel */}
        <section className="order-1 lg:order-2 lg:col-span-7 p-4 sm:p-8 lg:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            {/* PORTAL ROLE SELECTOR PILLS */}
            <div className="p-1.5 bg-slate-100 rounded-2xl mb-6 flex items-center gap-1.5 border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setPortalRole('customer');
                  setLoginError(null);
                  setAdminError(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  portalRole === 'customer'
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Customer Portal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortalRole('admin');
                  setLoginError(null);
                  setAdminError(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  portalRole === 'admin'
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Administrator Console</span>
              </button>
            </div>

            {/* CUSTOMER PORTAL FORM */}
            {portalRole === 'customer' && (
              <>
                {/* Segmented Mode Switcher (Sign In vs Register Household) */}
                <div
                  role="tablist"
                  aria-label="Account authentication mode"
                  className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-6"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'login'}
                    onClick={() => {
                      setMode('login');
                      setRegError(null);
                    }}
                    className={`py-2.5 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      mode === 'login'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'register'}
                    onClick={() => {
                      setMode('register');
                      setLoginError(null);
                    }}
                    className={`py-2.5 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      mode === 'register'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Register Household
                  </button>
                </div>

                {mode === 'login' ? (
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      Sign in to your household
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Enter your Consumer ID or registered phone number and passcode.
                    </p>

                    {loginError && (
                      <div
                        role="alert"
                        className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4" noValidate>
                      <div>
                        <label
                          htmlFor="login-identifier"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          Consumer ID or Phone Number
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="login-identifier"
                            type="text"
                            autoComplete="username"
                            placeholder="e.g. CON101 or 9876543210"
                            value={identifier}
                            onChange={(e) => {
                              setIdentifier(e.target.value);
                              setLoginError(null);
                            }}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="login-passcode"
                            className="block text-xs font-semibold text-slate-700"
                          >
                            Passcode / PIN
                          </label>
                          <span className="text-xs text-slate-500 font-mono">Demo PIN: 1234</span>
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="login-passcode"
                            type={showPasscode ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="Enter 4-digit PIN (e.g. 1234)"
                            value={passcode}
                            onChange={(e) => {
                              setPasscode(e.target.value);
                              setLoginError(null);
                            }}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-mono rounded-xl pl-10 pr-11 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasscode(!showPasscode)}
                            aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                          >
                            {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberSession}
                            onChange={(e) => setRememberSession(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                          <span>Keep me signed in this session</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 px-6 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>

                    {/* Quick Household Demo Switcher */}
                    <div className="mt-7 pt-6 border-t border-slate-200/80">
                      <p className="text-xs font-semibold text-slate-500 mb-3">
                        Quick demo sign-in (seeded households)
                      </p>
                      <div className="space-y-2">
                        {demoHouseholds.map((c) => (
                          <button
                            key={c.consumerID}
                            type="button"
                            onClick={() => handleQuickDemoLogin(c)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/50 transition-colors text-left cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {c.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate">
                                  {c.name}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono truncate">
                                  {c.consumerID} · {c.meterNumber || 'Smart Meter'}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-sky-600 group-hover:text-sky-700 shrink-0 ml-2">
                              Sign in →
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      Register a new household
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Generate Consumer ID <span className="font-mono font-bold text-sky-700">{nextConsumerId}</span> and begin tracking usage.
                    </p>

                    {regError && (
                      <div
                        role="alert"
                        className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{regError}</span>
                      </div>
                    )}

                    <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4" noValidate>
                      <div>
                        <label
                          htmlFor="reg-name"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          Household / Consumer Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="reg-name"
                            type="text"
                            placeholder="e.g. Meera Krishnan"
                            value={regName}
                            onChange={(e) => {
                              setRegName(e.target.value);
                              setRegError(null);
                            }}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="reg-address"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          Residential Address
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="reg-address"
                            type="text"
                            placeholder="e.g. Villa 22, Cedar Park Sector 7"
                            value={regAddress}
                            onChange={(e) => {
                              setRegAddress(e.target.value);
                              setRegError(null);
                            }}
                            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="reg-phone"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                          >
                            10-Digit Phone Number
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              id="reg-phone"
                              type="tel"
                              placeholder="9812345678"
                              value={regPhone}
                              onChange={(e) => {
                                setRegPhone(e.target.value);
                                setRegError(null);
                              }}
                              className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-mono rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="reg-pin"
                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                          >
                            Create 4-Digit PIN
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              id="reg-pin"
                              type={showRegPin ? 'text' : 'password'}
                              placeholder="e.g. 4321"
                              value={regPin}
                              onChange={(e) => {
                                setRegPin(e.target.value);
                                setRegError(null);
                              }}
                              className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-mono rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPin(!showRegPin)}
                              aria-label={showRegPin ? 'Hide registration PIN' : 'Show registration PIN'}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                            >
                              {showRegPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl flex items-center gap-2.5 text-xs text-sky-900">
                        <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>
                          Assigned ID <strong className="font-mono">{nextConsumerId}</strong> will be saved to your active simulation session.
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 px-6 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Register &amp; Sign In</span>
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* ADMINISTRATOR CONSOLE FORM */}
            {portalRole === 'admin' && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                    Authority Access Gate
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Sign in to Administrator Console
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Administrative access to municipal billing, tariff rules, and telemetry feeds.
                </p>

                {adminError && (
                  <div
                    role="alert"
                    className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{adminError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminSubmit} className="mt-6 space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="admin-email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Administrator Email / Username
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="admin-email"
                        type="text"
                        autoComplete="username"
                        placeholder="admin@aquabill.local"
                        value={adminEmail}
                        onChange={(e) => {
                          setAdminEmail(e.target.value);
                          setAdminError(null);
                        }}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-mono rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="admin-password"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Administrator Password
                      </label>
                      <span className="text-xs text-slate-500 font-mono">Demo: Admin@1234</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="admin-password"
                        type={showAdminPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Admin@1234"
                        value={adminPassword}
                        onChange={(e) => {
                          setAdminPassword(e.target.value);
                          setAdminError(null);
                        }}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-mono rounded-xl pl-10 pr-11 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-6 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Enter Administrator Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Quick One-Click Admin Sign-In */}
                <div className="mt-7 pt-6 border-t border-slate-200/80">
                  <p className="text-xs font-semibold text-slate-500 mb-3">
                    Fast Demo Access (Pre-Configured Utility Admin)
                  </p>
                  <button
                    type="button"
                    onClick={handleQuickAdminDemo}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/60 transition-all text-left cursor-pointer group shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        VR
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">
                            Vikramaditya Rao
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-sky-200 text-sky-950 uppercase">
                            Chief Engineer
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5 truncate">
                          admin@aquabill.local · Pass: Admin@1234
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-sky-700 group-hover:text-sky-900 shrink-0 ml-2">
                      Sign In →
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
