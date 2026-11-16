import { TariffConfig, SlabBreakdown, Bill } from '../types';

export const DEFAULT_TARIFF: TariffConfig = {
  slab1Limit: 10,
  slab1Rate: 5,
  slab2Limit: 20,
  slab2Rate: 8,
  slab3Limit: 30,
  slab3Rate: 12,
  slab4Rate: 15,
  fixedServiceCharge: 50,
  leakageThresholdKL: 30,
};

export function calculateProgressiveBilling(
  consumptionKL: number,
  tariff: TariffConfig = DEFAULT_TARIFF
): { breakdown: SlabBreakdown; waterCharges: number; totalAmount: number } {
  const units = Math.max(0, consumptionKL);
  let remaining = units;

  // Slab 1: 0 - 10 KL
  const slab1Units = Math.min(remaining, tariff.slab1Limit);
  const slab1Amount = slab1Units * tariff.slab1Rate;
  remaining = Math.max(0, remaining - slab1Units);

  // Slab 2: 10 - 20 KL (span = 10)
  const slab2Span = Math.max(0, tariff.slab2Limit - tariff.slab1Limit);
  const slab2Units = Math.min(remaining, slab2Span);
  const slab2Amount = slab2Units * tariff.slab2Rate;
  remaining = Math.max(0, remaining - slab2Units);

  // Slab 3: 20 - 30 KL (span = 10)
  const slab3Span = Math.max(0, tariff.slab3Limit - tariff.slab2Limit);
  const slab3Units = Math.min(remaining, slab3Span);
  const slab3Amount = slab3Units * tariff.slab3Rate;
  remaining = Math.max(0, remaining - slab3Units);

  // Slab 4: Above 30 KL
  const slab4Units = remaining;
  const slab4Amount = slab4Units * tariff.slab4Rate;

  const waterCharges = slab1Amount + slab2Amount + slab3Amount + slab4Amount;
  const totalAmount = waterCharges + tariff.fixedServiceCharge;

  return {
    breakdown: {
      slab1Units,
      slab1Rate: tariff.slab1Rate,
      slab1Amount,
      slab2Units,
      slab2Rate: tariff.slab2Rate,
      slab2Amount,
      slab3Units,
      slab3Rate: tariff.slab3Rate,
      slab3Amount,
      slab4Units,
      slab4Rate: tariff.slab4Rate,
      slab4Amount,
    },
    waterCharges,
    totalAmount,
  };
}

export function createBillObject(
  billID: string,
  consumerID: string,
  consumerName: string,
  month: string,
  year: number,
  previousReading: number,
  currentReading: number,
  tariff: TariffConfig = DEFAULT_TARIFF
): Bill {
  const consumptionKL = Math.max(0, currentReading - previousReading);
  const consumptionLitres = consumptionKL * 1000;
  const { breakdown, waterCharges, totalAmount } = calculateProgressiveBilling(consumptionKL, tariff);

  const billDate = new Date().toISOString().split('T')[0];
  const dueDateObj = new Date();
  dueDateObj.setDate(dueDateObj.getDate() + 15);
  const dueDate = dueDateObj.toISOString().split('T')[0];

  return {
    billID,
    consumerID,
    consumerName,
    month,
    year,
    previousReading,
    currentReading,
    consumptionKL,
    consumptionLitres,
    breakdown,
    waterCharges,
    serviceCharge: tariff.fixedServiceCharge,
    totalAmount,
    paymentStatus: 'UNPAID',
    billDate,
    dueDate,
  };
}
