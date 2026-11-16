import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProgressiveBilling, createBillObject, DEFAULT_TARIFF } from './billingCalculator';

test('Billing calculation for 10 KL (Slab 1 boundary)', () => {
  const result = calculateProgressiveBilling(10, DEFAULT_TARIFF);
  assert.equal(result.breakdown.slab1Units, 10);
  assert.equal(result.breakdown.slab1Amount, 50);
  assert.equal(result.breakdown.slab2Units, 0);
  assert.equal(result.waterCharges, 50);
  assert.equal(result.totalAmount, 100); // 50 water + 50 service fee
});

test('Billing calculation for 25 KL (Slab 1, 2, and 3)', () => {
  const result = calculateProgressiveBilling(25, DEFAULT_TARIFF);
  assert.equal(result.breakdown.slab1Units, 10);
  assert.equal(result.breakdown.slab1Amount, 50);
  assert.equal(result.breakdown.slab2Units, 10);
  assert.equal(result.breakdown.slab2Amount, 80);
  assert.equal(result.breakdown.slab3Units, 5);
  assert.equal(result.breakdown.slab3Amount, 60);
  assert.equal(result.breakdown.slab4Units, 0);
  assert.equal(result.waterCharges, 190);
  assert.equal(result.totalAmount, 240); // 190 water + 50 service fee
});

test('Billing calculation for 38 KL (All 4 progressive slabs)', () => {
  const result = calculateProgressiveBilling(38, DEFAULT_TARIFF);
  assert.equal(result.breakdown.slab1Units, 10);
  assert.equal(result.breakdown.slab1Amount, 50);
  assert.equal(result.breakdown.slab2Units, 10);
  assert.equal(result.breakdown.slab2Amount, 80);
  assert.equal(result.breakdown.slab3Units, 10);
  assert.equal(result.breakdown.slab3Amount, 120);
  assert.equal(result.breakdown.slab4Units, 8);
  assert.equal(result.breakdown.slab4Amount, 120);
  assert.equal(result.waterCharges, 370);
  assert.equal(result.totalAmount, 420); // 370 water + 50 service fee
});

test('Billing calculation handles 0 KL correctly', () => {
  const result = calculateProgressiveBilling(0, DEFAULT_TARIFF);
  assert.equal(result.waterCharges, 0);
  assert.equal(result.totalAmount, 50); // Only fixed service charge
});

test('Bill object creation sets due date and unpaid status', () => {
  const bill = createBillObject('BIL999', 'CON101', 'Ravindra Sharma', 'July', 2024, 200, 225, DEFAULT_TARIFF);
  assert.equal(bill.consumptionKL, 25);
  assert.equal(bill.consumptionLitres, 25000);
  assert.equal(bill.totalAmount, 240);
  assert.equal(bill.paymentStatus, 'UNPAID');
});
