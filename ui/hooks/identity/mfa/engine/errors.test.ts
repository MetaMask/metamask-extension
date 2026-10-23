import {
  MfaError,
  getMfaErrorCode,
} from '@metamask/profile-sync-controller/sdk';
import { MfaFlowError, getErrorHandling, getFlowErrorCode } from './errors';

describe('getErrorHandling', () => {
  (
    [
      ['aal2_required', 'refresh'],
      ['invalid_code', 'inline'],
      ['flow_expired', 'restart'],
      ['otp_resend_cooldown', 'cooldown'],
      ['max_identifiers_reached', 'failure'],
      ['kratos_unavailable', 'transient'],
    ] as const
  ).forEach(([code, handling]) => {
    it(`handles ${code} as ${handling}`, () => {
      expect(getErrorHandling(code)).toBe(handling);
    });
  });
});

describe('getFlowErrorCode', () => {
  it('reads a known MFA code', () => {
    expect(getFlowErrorCode(new MfaError('invalid_code', 'wrong'))).toBe(
      'invalid_code',
    );
  });

  (
    [
      ['no code', new TypeError('Network request failed')],
      ['an unknown code', { mfaCode: 'brand_new_code' }],
      ['a prototype key', { mfaCode: 'toString' }],
    ] as const
  ).forEach(([label, error]) => {
    it(`falls back to server_error for ${label}`, () => {
      expect(getFlowErrorCode(error)).toBe('server_error');
    });
  });
});

describe('MfaFlowError', () => {
  it('is readable with getMfaErrorCode and carries the completed methods', () => {
    const error = new MfaFlowError('flow_cancelled', ['email_otp']);

    expect(getMfaErrorCode(error)).toBe('flow_cancelled');
    expect(error.data).toStrictEqual({ completed: ['email_otp'] });
  });
});
