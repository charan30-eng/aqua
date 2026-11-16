/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LoginPage } from './components/LoginPage';
import { SectorsUsageChart } from './components/SectorsUsageChart';
import { CommunitiesSavingsChart } from './components/CommunitiesSavingsChart';
import { UsageActivityPanel } from './components/UsageActivityPanel';

// Customer Views
import { ConsumersView } from './components/views/ConsumersView';
import { TrackUsageView } from './components/views/TrackUsageView';
import { BillingView } from './components/views/BillingView';
import { HelpView } from './components/views/HelpView';

// Administrator Components & Views
import { AdminSidebar } from './components/admin/AdminSidebar';
import { AdminTopHeader } from './components/admin/AdminTopHeader';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { AdminConsumersView } from './components/admin/AdminConsumersView';
import { AdminMetersView } from './components/admin/AdminMetersView';
import { AdminTariffView } from './components/admin/AdminTariffView';
import { AdminBillsView } from './components/admin/AdminBillsView';
import { AdminPaymentsView } from './components/admin/AdminPaymentsView';
import { AdminAuditView } from './components/admin/AdminAuditView';

// Modals
import { RegisterConsumerModal } from './components/modals/RegisterConsumerModal';
import { MeterReadingModal } from './components/modals/MeterReadingModal';
import { BillInvoiceModal } from './components/modals/BillInvoiceModal';
import { LeakageAlertModal } from './components/modals/LeakageAlertModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { CTerminalSimulatorModal } from './components/modals/CTerminalSimulatorModal';

import {
  initialConsumers,
  initialRecords,
  initialBills,
  initialPayments,
  initialActivities,
} from './data/initialData';
import { defaultAdminUser } from './data/adminInitialData';
import {
  Consumer,
  WaterRecord,
  Bill,
  Payment,
  TariffConfig,
  UsageActivityItem,
  AdminUser,
  UserRole,
} from './types';
import { DEFAULT_TARIFF, createBillObject } from './utils/billingCalculator';

export default function App() {
  // Authentication & Role State
  const [consumers, setConsumers] = useState<Consumer[]>(initialConsumers);
  const [adminUser] = useState<AdminUser>(defaultAdminUser);

  const getInitialAuthState = () => {
    if (typeof window === 'undefined') {
      return { authenticated: false, role: 'customer' as UserRole, consumer: initialConsumers[0] };
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const roleParam = params.get('role');
      const startRole: UserRole = roleParam === 'admin' ? 'admin' : 'customer';
      return { authenticated: true, role: startRole, consumer: initialConsumers[0] };
    }
    const savedRole = window.sessionStorage.getItem('aqua_logged_in_role') as UserRole | null;
    const savedId = window.sessionStorage.getItem('aqua_logged_in_consumer_id');

    if (savedRole === 'admin') {
      return { authenticated: true, role: 'admin' as UserRole, consumer: initialConsumers[0] };
    }
    if (savedId) {
      const found = initialConsumers.find((c) => c.consumerID === savedId);
      if (found) {
        return { authenticated: true, role: 'customer' as UserRole, consumer: found };
      }
    }
    return { authenticated: false, role: 'customer' as UserRole, consumer: initialConsumers[0] };
  };

  const initialAuth = getInitialAuthState();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuth.authenticated);
  const [userRole, setUserRole] = useState<UserRole>(initialAuth.role);

  // Navigation tabs
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [adminTab, setAdminTab] = useState<string>('admin-dashboard');

  // Customer portal selection
  const [currentConsumer, setCurrentConsumer] = useState<Consumer>(initialAuth.consumer);

  // Operational records, bills, payments & activities
  const [records, setRecords] = useState<WaterRecord[]>(initialRecords);
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [activities, setActivities] = useState<UsageActivityItem[]>(initialActivities);
  const [tariff, setTariff] = useState<TariffConfig>(DEFAULT_TARIFF);

  // Global search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [isBillInvoiceModalOpen, setIsBillInvoiceModalOpen] = useState(false);
  const [selectedBillForInvoice, setSelectedBillForInvoice] = useState<Bill | null>(null);

  const [isLeakageModalOpen, setIsLeakageModalOpen] = useState(false);
  const [selectedLeakageItem, setSelectedLeakageItem] = useState<UsageActivityItem | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCSimulatorOpen, setIsCSimulatorOpen] = useState(false);

  // Unread leak alert count
  const unreadAlertCount = activities.filter((a) => a.type === 'leakage').length;
  const adminSurgeAlertCount = records.filter((r) => r.consumptionKL >= tariff.leakageThresholdKL).length;

  // Retrieve latest reading for any consumer
  const getLatestReading = (consumerId: string): number => {
    const consumerRecords = records.filter((r) => r.consumerID === consumerId);
    if (consumerRecords.length === 0) return 100;
    return consumerRecords[consumerRecords.length - 1].currentReading;
  };

  // Handler: Customer Login
  const handleLoginSuccess = (consumer: Consumer, rememberSession: boolean) => {
    setCurrentConsumer(consumer);
    setUserRole('customer');
    setCurrentTab('dashboard');
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('aqua_logged_in_role', 'customer');
      if (rememberSession) {
        window.sessionStorage.setItem('aqua_logged_in_consumer_id', consumer.consumerID);
      } else {
        window.sessionStorage.removeItem('aqua_logged_in_consumer_id');
      }
    }
  };

  // Handler: Admin Login
  const handleAdminLoginSuccess = () => {
    setUserRole('admin');
    setAdminTab('admin-dashboard');
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('aqua_logged_in_role', 'admin');
    }
  };

  const handleRegisterAndLogin = (newConsumer: Consumer, rememberSession: boolean) => {
    setConsumers((prev) => [...prev, newConsumer]);
    handleLoginSuccess(newConsumer, rememberSession);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentTab('dashboard');
    setAdminTab('admin-dashboard');
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('aqua_logged_in_consumer_id');
      window.sessionStorage.removeItem('aqua_logged_in_role');
    }
  };

  // Handler: Register Consumer
  const handleRegisterConsumer = (newConsumer: Consumer) => {
    setConsumers((prev) => [...prev, newConsumer]);
    setCurrentConsumer(newConsumer);
  };

  // Handler: Record Meter Reading
  const handleMeterReading = (record: WaterRecord, shouldGenerateBill: boolean) => {
    setRecords((prev) => [...prev, record]);

    // Check for simulated leak anomaly
    if (record.consumptionKL > tariff.leakageThresholdKL) {
      const newLeakAlert: UsageActivityItem = {
        id: `leak-${Date.now()}`,
        type: 'leakage',
        title: 'Action Needed - High Consumption Leak',
        time: 'Just now',
        litres: Math.round(record.consumptionLitres / 30 / 24),
        durationMinutes: 60,
        dateStr: record.recordDate,
        status: 'Surge Alert',
        details: `Consumption of ${record.consumptionKL.toFixed(2)} KL for ${record.month} exceeded the ${tariff.leakageThresholdKL} KL threshold. Check interior plumbing fixtures.`,
      };
      setActivities((prev) => [newLeakAlert, ...prev]);
    }

    if (shouldGenerateBill) {
      const consumer = consumers.find((c) => c.consumerID === record.consumerID) || currentConsumer;
      const nextBillId = `BIL${500 + bills.length + 1}`;
      const newBill = createBillObject(
        nextBillId,
        record.consumerID,
        consumer.name,
        record.month,
        record.year,
        record.previousReading,
        record.currentReading,
        tariff
      );
      setBills((prev) => [newBill, ...prev]);
      setSelectedBillForInvoice(newBill);
      setIsBillInvoiceModalOpen(true);
    }
  };

  // Handler: Settle Bill Payment
  const handlePayBill = (billId: string, mode: 'Cash' | 'UPI' | 'Bank Card' | 'NetBanking' = 'UPI') => {
    const bill = bills.find((b) => b.billID === billId);
    if (!bill) return;

    setBills((prev) =>
      prev.map((b) => (b.billID === billId ? { ...b, paymentStatus: 'PAID' } : b))
    );

    const newPayment: Payment = {
      paymentID: `PAY${Math.floor(300 + Math.random() * 600)}`,
      billID: bill.billID,
      consumerID: bill.consumerID,
      amountPaid: bill.totalAmount,
      paymentMode: mode,
      paymentDate: new Date().toISOString().split('T')[0],
      receiptNumber: `RCP-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    setPayments((prev) => [newPayment, ...prev]);
  };

  // Handler: Cancel Bill (Admin action)
  const handleCancelBill = (billId: string, reason: string) => {
    setBills((prev) =>
      prev.map((b) =>
        b.billID === billId ? { ...b, paymentStatus: 'CANCELLED', cancelledReason: reason } : b
      )
    );
  };

  // Handler: Settle manual/admin payment
  const handleRecordPayment = (newPayment: Payment) => {
    setPayments((prev) => [newPayment, ...prev]);
    setBills((prev) =>
      prev.map((b) => (b.billID === newPayment.billID ? { ...b, paymentStatus: 'PAID' } : b))
    );
  };

  // Handler: Resolve leak
  const handleResolveLeak = (leakId: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== leakId));
  };

  const unpaidBills = bills.filter((b) => b.paymentStatus === 'UNPAID');

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          consumers={consumers}
          onLoginSuccess={handleLoginSuccess}
          onRegisterSuccess={handleRegisterAndLogin}
          onAdminLoginSuccess={handleAdminLoginSuccess}
          onOpenCSimulator={() => setIsCSimulatorOpen(true)}
          initialRole={userRole}
        />
        <CTerminalSimulatorModal
          isOpen={isCSimulatorOpen}
          onClose={() => setIsCSimulatorOpen(false)}
          consumers={consumers}
          records={records}
          bills={bills}
          payments={payments}
          tariff={tariff}
        />
      </>
    );
  }

  // ==========================================
  // 1. ADMINISTRATOR CONSOLE PORTAL SHELL
  // ==========================================
  if (userRole === 'admin') {
    return (
      <div className="min-h-screen bg-[#edf3f8] text-slate-800 p-2 sm:p-4 lg:p-6 font-sans flex justify-center items-start">
        <div className="w-full max-w-[1560px] bg-white/60 backdrop-blur-md rounded-[32px] p-3 sm:p-5 shadow-2xl border border-white/80 flex flex-col lg:flex-row gap-5 min-h-[920px]">
          {/* Admin Dedicated Sidebar */}
          <AdminSidebar
            currentTab={adminTab}
            onSelectTab={(tab) => setAdminTab(tab)}
            onOpenCSimulator={() => setIsCSimulatorOpen(true)}
            onSwitchToCustomerPortal={() => setUserRole('customer')}
            onLogout={handleLogout}
            alertCount={adminSurgeAlertCount}
          />

          {/* Admin Center & Right Main Body */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Admin Top Header */}
            <AdminTopHeader
              adminUser={adminUser}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
              onOpenMeterModal={() => setIsMeterModalOpen(true)}
              onOpenCSimulator={() => setIsCSimulatorOpen(true)}
              alertCount={adminSurgeAlertCount}
            />

            {/* Admin Views */}
            <main className="flex-1 mt-2">
              {adminTab === 'admin-dashboard' && (
                <AdminDashboardView
                  consumers={consumers}
                  records={records}
                  bills={bills}
                  payments={payments}
                  tariff={tariff}
                  onViewInvoice={(b) => {
                    setSelectedBillForInvoice(b);
                    setIsBillInvoiceModalOpen(true);
                  }}
                  onOpenMeterModal={() => setIsMeterModalOpen(true)}
                  onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                  onOpenCSimulator={() => setIsCSimulatorOpen(true)}
                  onSelectTab={(t) => setAdminTab(t)}
                />
              )}

              {adminTab === 'admin-consumers' && (
                <AdminConsumersView
                  consumers={consumers}
                  onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                  onRecordReadingForConsumer={(c) => {
                    setCurrentConsumer(c);
                    setIsMeterModalOpen(true);
                  }}
                />
              )}

              {adminTab === 'admin-meters' && (
                <AdminMetersView
                  onOpenMeterModal={() => setIsMeterModalOpen(true)}
                />
              )}

              {adminTab === 'admin-tariffs' && (
                <AdminTariffView
                  tariff={tariff}
                  onUpdateTariff={(t) => setTariff(t)}
                />
              )}

              {adminTab === 'admin-bills' && (
                <AdminBillsView
                  bills={bills}
                  onViewInvoice={(b) => {
                    setSelectedBillForInvoice(b);
                    setIsBillInvoiceModalOpen(true);
                  }}
                  onOpenMeterModal={() => setIsMeterModalOpen(true)}
                  onCancelBill={handleCancelBill}
                />
              )}

              {adminTab === 'admin-payments' && (
                <AdminPaymentsView
                  payments={payments}
                  bills={bills}
                  consumers={consumers}
                  onRecordPayment={handleRecordPayment}
                />
              )}

              {adminTab === 'admin-audit' && <AdminAuditView />}
            </main>
          </div>
        </div>

        {/* Global Modals */}
        <RegisterConsumerModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onRegister={handleRegisterConsumer}
          existingConsumers={consumers}
        />

        <MeterReadingModal
          isOpen={isMeterModalOpen}
          onClose={() => setIsMeterModalOpen(false)}
          consumers={consumers}
          currentConsumer={currentConsumer}
          tariff={tariff}
          onSubmitReading={handleMeterReading}
          getLatestReading={getLatestReading}
        />

        <BillInvoiceModal
          isOpen={isBillInvoiceModalOpen}
          onClose={() => {
            setIsBillInvoiceModalOpen(false);
            setSelectedBillForInvoice(null);
          }}
          bill={selectedBillForInvoice}
          onPayBill={(billId) => handlePayBill(billId)}
        />

        <CTerminalSimulatorModal
          isOpen={isCSimulatorOpen}
          onClose={() => setIsCSimulatorOpen(false)}
          consumers={consumers}
          records={records}
          bills={bills}
          payments={payments}
          tariff={tariff}
        />
      </div>
    );
  }

  // ==========================================
  // 2. CUSTOMER / HOUSEHOLD PORTAL SHELL
  // ==========================================
  return (
    <div className="min-h-screen bg-[#edf3f8] text-slate-800 p-2 sm:p-4 lg:p-6 font-sans flex justify-center items-start">
      {/* Outer Dashboard Card Wrapper matching mockup */}
      <div className="w-full max-w-[1520px] bg-white/60 backdrop-blur-md rounded-[32px] p-3 sm:p-5 shadow-2xl border border-white/80 flex flex-col lg:flex-row gap-5 min-h-[920px]">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'settings') {
              setIsSettingsModalOpen(true);
            } else {
              setCurrentTab(tab);
            }
          }}
          onOpenCSimulator={() => setIsCSimulatorOpen(true)}
          onSwitchToAdminPortal={() => setUserRole('admin')}
          onLogout={handleLogout}
          unreadAlertCount={unreadAlertCount}
        />

        {/* Center & Right Main Body */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <TopHeader
            currentConsumer={currentConsumer}
            allConsumers={consumers}
            onSelectConsumer={(c) => setCurrentConsumer(c)}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            onOpenMeterModal={() => setIsMeterModalOpen(true)}
            onOpenLeakageModal={() => {
              setSelectedLeakageItem(activities.find((a) => a.type === 'leakage') || null);
              setIsLeakageModalOpen(true);
            }}
            onOpenCSimulator={() => setIsCSimulatorOpen(true)}
            unreadAlertCount={unreadAlertCount}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Tab Views */}
          <main className="flex-1 mt-2">
            {currentTab === 'dashboard' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* Center 2-Card Column (8 cols on XL) */}
                <div className="xl:col-span-8 space-y-5">
                  {/* Top Card: Water Usage - Across Sectors */}
                  <SectorsUsageChart
                    onDayClick={(day, liters) => {
                      alert(`Simulation Data: June ${day} consumed ${liters} Litres (${(liters / 1000).toFixed(2)} KL).`);
                    }}
                  />

                  {/* Bottom Card: Usage & Savings - Across Communities */}
                  <CommunitiesSavingsChart />
                </div>

                {/* Right Column: Usage Activity Panel (4 cols on XL) */}
                <div className="xl:col-span-4">
                  <UsageActivityPanel
                    activities={activities}
                    onOpenLeakageModal={(act) => {
                      setSelectedLeakageItem(act || null);
                      setIsLeakageModalOpen(true);
                    }}
                    onOpenMeterModal={() => setIsMeterModalOpen(true)}
                  />
                </div>
              </div>
            )}

            {currentTab === 'profile' && (
              <ConsumersView
                consumers={consumers}
                onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                onSelectConsumer={(c) => {
                  setCurrentConsumer(c);
                  setCurrentTab('dashboard');
                }}
                onRecordReadingForConsumer={(c) => {
                  setCurrentConsumer(c);
                  setIsMeterModalOpen(true);
                }}
              />
            )}

            {currentTab === 'track-usage' && (
              <TrackUsageView
                records={records}
                consumers={consumers}
                tariff={tariff}
                onOpenMeterModal={() => setIsMeterModalOpen(true)}
              />
            )}

            {currentTab === 'billing' && (
              <BillingView
                bills={bills}
                tariff={tariff}
                onViewInvoice={(b) => {
                  setSelectedBillForInvoice(b);
                  setIsBillInvoiceModalOpen(true);
                }}
                onPayBill={() => {
                  setIsPaymentModalOpen(true);
                }}
                onOpenMeterModal={() => setIsMeterModalOpen(true)}
              />
            )}

            {currentTab === 'help' && (
              <HelpView onOpenCSimulator={() => setIsCSimulatorOpen(true)} />
            )}
          </main>
        </div>
      </div>

      {/* Global Functional Modals */}
      <RegisterConsumerModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegister={handleRegisterConsumer}
        existingConsumers={consumers}
      />

      <MeterReadingModal
        isOpen={isMeterModalOpen}
        onClose={() => setIsMeterModalOpen(false)}
        consumers={consumers}
        currentConsumer={currentConsumer}
        tariff={tariff}
        onSubmitReading={handleMeterReading}
        getLatestReading={getLatestReading}
      />

      <BillInvoiceModal
        isOpen={isBillInvoiceModalOpen}
        onClose={() => {
          setIsBillInvoiceModalOpen(false);
          setSelectedBillForInvoice(null);
        }}
        bill={selectedBillForInvoice}
        onPayBill={(billId) => handlePayBill(billId)}
      />

      <LeakageAlertModal
        isOpen={isLeakageModalOpen}
        onClose={() => {
          setIsLeakageModalOpen(false);
          setSelectedLeakageItem(null);
        }}
        activeItem={selectedLeakageItem}
        onResolveLeak={handleResolveLeak}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        unpaidBills={unpaidBills}
        payments={payments}
        onProcessPayment={handlePayBill}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        tariff={tariff}
        onSaveTariff={setTariff}
      />

      <CTerminalSimulatorModal
        isOpen={isCSimulatorOpen}
        onClose={() => setIsCSimulatorOpen(false)}
        consumers={consumers}
        records={records}
        bills={bills}
        payments={payments}
        tariff={tariff}
      />
    </div>
  );
}
