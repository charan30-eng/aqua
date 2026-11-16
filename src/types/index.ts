/**
 * TypeScript Type Definitions for Smart Water Management System
 */

export type UserRole = 'customer' | 'admin';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  title: string;
  department: string;
  avatarUrl?: string;
}

export interface Consumer {
  consumerID: string;
  name: string;
  address: string;
  phoneNumber: string;
  registrationDate: string;
  avatarUrl?: string;
  meterNumber?: string;
  sector?: string;
  status?: 'active' | 'inactive' | 'suspended';
  email?: string;
}

export interface WaterRecord {
  recordID: string;
  consumerID: string;
  month: string;
  year: number;
  previousReading: number; // in KL
  currentReading: number;  // in KL
  consumptionKL: number;
  consumptionLitres: number;
  recordDate: string;
  meterNumber?: string;
}

export interface SlabBreakdown {
  slab1Units: number;
  slab1Rate: number;
  slab1Amount: number;
  slab2Units: number;
  slab2Rate: number;
  slab2Amount: number;
  slab3Units: number;
  slab3Rate: number;
  slab3Amount: number;
  slab4Units: number;
  slab4Rate: number;
  slab4Amount: number;
}

export interface Bill {
  billID: string;
  consumerID: string;
  consumerName: string;
  month: string;
  year: number;
  previousReading: number;
  currentReading: number;
  consumptionKL: number;
  consumptionLitres: number;
  breakdown: SlabBreakdown;
  waterCharges: number;
  serviceCharge: number;
  totalAmount: number;
  paymentStatus: 'UNPAID' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED';
  billDate: string;
  dueDate: string;
  cancelledReason?: string;
}

export interface Payment {
  paymentID: string;
  billID: string;
  consumerID: string;
  amountPaid: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Card' | 'NetBanking' | 'Bank Transfer';
  paymentDate: string;
  receiptNumber: string;
  transactionRef?: string;
  notes?: string;
  status?: 'completed' | 'pending' | 'failed';
}

export interface TariffConfig {
  slab1Limit: number; // 10 KL
  slab1Rate: number;  // ₹5
  slab2Limit: number; // 20 KL
  slab2Rate: number;  // ₹8
  slab3Limit: number; // 30 KL
  slab3Rate: number;  // ₹12
  slab4Rate: number;  // ₹15
  fixedServiceCharge: number; // ₹50
  leakageThresholdKL: number; // 30 KL
}

export interface TariffPlan {
  id: string;
  name: string;
  mode: 'flat' | 'slab';
  ratePerKL: number; // ₹ per KL (or default flat rate)
  fixedCharge: number; // ₹ fixed service charge
  taxPercentage: number; // in %
  slabConfig: string; // e.g. "0-10:5, 11-20:8, 21-30:12, 31+:15"
  effectiveFrom: string;
  status: 'active' | 'inactive';
}

export interface MeterDetail {
  meterNumber: string;
  consumerID: string;
  consumerName: string;
  sector: string;
  status: 'active' | 'maintenance' | 'inactive';
  installationDate: string;
  lastReadingKL: number;
  lastReadingDate: string;
  model: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  details: string;
  status: 'success' | 'warning' | 'error';
  ipAddress: string;
}

export interface UsageActivityItem {
  id: string;
  type: 'usage' | 'leakage' | 'reading' | 'billing' | 'payment';
  title: string;
  time: string;
  litres: number;
  durationMinutes: number;
  dateStr: string; // e.g. "2024-06-17"
  status?: string;
  details?: string;
  consumerID?: string;
}
