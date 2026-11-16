import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateConsumer,
  validateRegistrationInput,
  generateNextConsumerID,
} from './auth';
import { initialConsumers } from '../data/initialData';

test('authenticateConsumer succeeds with valid Consumer ID (case-insensitive) and demo PIN', () => {
  const result = authenticateConsumer(initialConsumers, 'con101', '1234');
  assert.equal(result.success, true);
  assert.equal(result.consumer?.consumerID, 'CON101');
  assert.equal(result.consumer?.name, 'Ravindra Sharma');
});

test('authenticateConsumer succeeds with registered phone number and last-4-digit PIN', () => {
  const result = authenticateConsumer(initialConsumers, '9823456789', '6789');
  assert.equal(result.success, true);
  assert.equal(result.consumer?.consumerID, 'CON102');
});

test('authenticateConsumer rejects empty identifier or passcode', () => {
  const emptyId = authenticateConsumer(initialConsumers, '   ', '1234');
  assert.equal(emptyId.success, false);
  assert.ok(emptyId.error?.includes('Consumer ID'));

  const emptyPass = authenticateConsumer(initialConsumers, 'CON101', '');
  assert.equal(emptyPass.success, false);
  assert.ok(emptyPass.error?.includes('passcode'));
});

test('authenticateConsumer rejects unknown ID or wrong passcode', () => {
  const unknown = authenticateConsumer(initialConsumers, 'CON999', '1234');
  assert.equal(unknown.success, false);
  assert.ok(unknown.error?.includes('No household account found'));

  const wrongPin = authenticateConsumer(initialConsumers, 'CON101', '0000');
  assert.equal(wrongPin.success, false);
  assert.ok(wrongPin.error?.includes('Incorrect passcode'));
});

test('validateRegistrationInput validates name, address, phone, and PIN', () => {
  assert.equal(
    validateRegistrationInput({ name: '', address: 'Sector 4', phoneNumber: '9876543210', pin: '1234' }).valid,
    false
  );
  assert.equal(
    validateRegistrationInput({ name: 'Asha', address: '', phoneNumber: '9876543210', pin: '1234' }).valid,
    false
  );
  assert.equal(
    validateRegistrationInput({ name: 'Asha', address: 'Sector 4', phoneNumber: '12345', pin: '1234' }).valid,
    false
  );
  assert.equal(
    validateRegistrationInput({ name: 'Asha', address: 'Sector 4', phoneNumber: '9876543210', pin: '12' }).valid,
    false
  );
  const ok = validateRegistrationInput({
    name: 'Asha',
    address: 'Sector 4',
    phoneNumber: '98765-43210',
    pin: '1234',
  });
  assert.equal(ok.valid, true);
  assert.equal(ok.cleanPhone, '9876543210');
});

test('generateNextConsumerID increments from highest existing ID', () => {
  assert.equal(generateNextConsumerID(initialConsumers), 'CON106');
  assert.equal(generateNextConsumerID([]), 'CON101');
});
