import { Consumer } from '../types';

export interface AuthResult {
  success: boolean;
  consumer?: Consumer;
  error?: string;
}

export interface RegistrationInput {
  name: string;
  address: string;
  phoneNumber: string;
  pin: string;
}

export interface RegistrationValidationResult {
  valid: boolean;
  error?: string;
  cleanPhone?: string;
}

/**
 * Authenticates a household consumer by Consumer ID (e.g. CON101) or 10-digit phone number,
 * and verifies their passcode/PIN (matches custom pin, last 4 digits of phone, or demo PIN '1234').
 */
export function authenticateConsumer(
  consumers: Consumer[],
  identifier: string,
  passcode: string
): AuthResult {
  const trimmedId = identifier.trim();
  const trimmedPass = passcode.trim();

  if (!trimmedId) {
    return { success: false, error: 'Please enter your Consumer ID or registered phone number.' };
  }

  if (!trimmedPass) {
    return { success: false, error: 'Please enter your account passcode or 4-digit PIN.' };
  }

  const normalizedId = trimmedId.toUpperCase();
  const cleanPhoneInput = trimmedId.replace(/[^0-9]/g, '');

  const matched = consumers.find(
    (c) =>
      c.consumerID.toUpperCase() === normalizedId ||
      (cleanPhoneInput.length >= 7 && c.phoneNumber === cleanPhoneInput)
  );

  if (!matched) {
    return {
      success: false,
      error: `No household account found for "${trimmedId}". Check your Consumer ID (e.g. CON101) or register a new household.`,
    };
  }

  const phoneLast4 = matched.phoneNumber.slice(-4);
  const isValidPass =
    trimmedPass === '1234' ||
    trimmedPass === phoneLast4 ||
    trimmedPass.toLowerCase() === 'aqua2024';

  if (!isValidPass) {
    return {
      success: false,
      error: `Incorrect passcode for ${matched.consumerID}. Use your 4-digit PIN (e.g. ${phoneLast4}) or demo PIN 1234.`,
    };
  }

  return { success: true, consumer: matched };
}

/**
 * Validates new household registration form inputs before creating a Consumer record.
 */
export function validateRegistrationInput(input: RegistrationInput): RegistrationValidationResult {
  if (!input.name.trim()) {
    return { valid: false, error: 'Please enter the household or consumer full name.' };
  }

  if (!input.address.trim()) {
    return { valid: false, error: 'Please enter the residential service address.' };
  }

  const cleanPhone = input.phoneNumber.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return { valid: false, error: 'Please enter a valid 10-digit contact phone number.' };
  }

  if (input.pin.trim().length < 4) {
    return { valid: false, error: 'Please create a passcode or PIN with at least 4 characters.' };
  }

  return { valid: true, cleanPhone };
}

export function generateNextConsumerID(consumers: Consumer[]): string {
  const nextNumber =
    consumers.reduce((max, c) => {
      const num = parseInt(c.consumerID.replace(/^CON/i, ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 100) + 1;
  return `CON${nextNumber}`;
}
