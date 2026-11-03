/* eslint-disable @typescript-eslint/naming-convention -- Segment properties and the server's codes are snake_case */
import { it } from '@jest/globals';
import { MfaError } from '@metamask/profile-sync-controller/sdk';
import {
  getBaseProperties,
  getErrorProperties,
  getFlowEndProperties,
  getStepViewedProperties,
} from './analytics';
import type { MfaFlowErrorCode, MfaFlowState, MfaFlowStep } from './types';

const state = (extra: Partial<MfaFlowState> = {}): MfaFlowState => ({
  step: { name: 'emailEntry' },
  busy: false,
  progress: { current: 1, total: 1 },
  ...extra,
});

describe('getBaseProperties', () => {
  it.each([
    ['vba.verifyEmail', 'vba'],
    ['settings.addPasskey', 'settings'],
    ['qa.enrollEmail', 'qa'],
    ['kalshi.deposit', 'other'],
  ])('maps the %s operation to the %s entry point', (operation, entryPoint) => {
    expect(
      getBaseProperties(
        { operation },
        { kind: 'verifyOrEnroll', methods: ['email_otp', 'totp'] },
      ),
    ).toStrictEqual({
      entry_point: entryPoint,
      operation,
      flow_type: 'verify_or_enroll',
      methods_required: ['email_otp', 'totp'],
    });
  });

  it('lists the one method of an enroll request', () => {
    expect(
      getBaseProperties(
        { operation: 'settings.addPasskey' },
        { kind: 'enroll', method: 'passkey' },
      ),
    ).toMatchObject({ flow_type: 'enroll', methods_required: ['passkey'] });
  });
});

const ERROR_TYPES: [MfaFlowErrorCode, string][] = [
  ['email_claimed', 'email_in_use'],
  ['multi_primary_srp', 'support_required'],
  ['max_identifiers_reached', 'support_required'],
  ['invalid_code', 'incorrect_code'],
  ['server_error', 'generic_error'],
];

describe('getErrorProperties', () => {
  it.each(ERROR_TYPES)('groups %s as %s', (code, type) => {
    expect(getErrorProperties(code)).toStrictEqual({
      error_code: code,
      error_type: type,
    });
  });
});

const STEPS: [MfaFlowStep, Record<string, unknown>][] = [
  [{ name: 'emailEntry' }, { screen_name: 'email_entry', method: 'email_otp' }],
  [
    {
      name: 'otp',
      purpose: 'verify',
      method: 'totp',
      codeSent: true,
    },
    { screen_name: 'otp', purpose: 'verify', method: 'totp' },
  ],
  [
    { name: 'picker', purpose: 'confirm', options: ['passkey', 'totp'] },
    {
      screen_name: 'picker',
      purpose: 'confirm',
      methods_offered: ['passkey', 'totp'],
    },
  ],
  [
    { name: 'failure', code: 'server_error', canRetry: true },
    {
      screen_name: 'failure',
    },
  ],
  [{ name: 'idle' }, {}],
];

describe('getStepViewedProperties', () => {
  it.each(STEPS)('describes the %o step', (step, properties) => {
    expect(getStepViewedProperties(step)).toStrictEqual(properties);
  });
});

describe('getFlowEndProperties', () => {
  it('ends with the error when the flow fails', () => {
    expect(
      getFlowEndProperties(
        new MfaError('multi_primary_srp', 'blocked'),
        state({
          step: { name: 'failure', code: 'multi_primary_srp', canRetry: false },
        }),
      ),
    ).toStrictEqual({
      status: 'failed',
      error_code: 'multi_primary_srp',
      error_type: 'support_required',
    });
  });

  it('ends with the screen and the error on it when the user leaves', () => {
    expect(
      getFlowEndProperties(
        new MfaError('flow_cancelled', 'left'),
        state({ error: 'email_claimed' }),
      ),
    ).toStrictEqual({
      status: 'cancelled',
      screen_name: 'email_entry',
      error_type: 'email_in_use',
    });
  });
});
