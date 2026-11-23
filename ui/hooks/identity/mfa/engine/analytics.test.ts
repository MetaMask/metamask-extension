/* eslint-disable @typescript-eslint/naming-convention -- Segment properties and the server's codes are snake_case */
import { it } from '@jest/globals';
import { MfaError } from '@metamask/profile-sync-controller/sdk';
import { createMfaTracker } from './analytics';
import type {
  MfaFlowErrorCode,
  MfaFlowRequest,
  MfaFlowState,
  MfaFlowStep,
  MfaReason,
} from './types';

const state = (extra: Partial<MfaFlowState> = {}): MfaFlowState => ({
  step: { name: 'emailEntry' },
  busy: false,
  progress: { current: 1, total: 1 },
  ...extra,
});

const build = (
  operation: MfaReason['operation'] = 'vba.verifyEmail',
  request: MfaFlowRequest = { kind: 'verifyOrEnroll', methods: ['email_otp'] },
) => {
  const trackEvent = jest.fn();
  const tracker = createMfaTracker({
    reason: { operation },
    request,
    trackEvent,
  });
  return { tracker, trackEvent };
};

describe('createMfaTracker', () => {
  it.each<[MfaReason['operation'], string]>([
    ['vba.verifyEmail', 'vba'],
    ['settings.addPasskey', 'settings'],
    ['qa.enrollEmail', 'qa'],
  ])('maps the %s operation to the %s entry point', (operation, entryPoint) => {
    const { tracker, trackEvent } = build(operation);

    tracker.started();

    expect(trackEvent).toHaveBeenCalledWith('MFA Flow Status Updated', {
      flow_id: expect.any(String),
      entry_point: entryPoint,
      operation,
      flow_type: 'verify_or_enroll',
      methods_required: ['email_otp'],
      status: 'started',
    });
  });

  it('lists the one method of an enroll request', () => {
    const { tracker, trackEvent } = build('settings.addPasskey', {
      kind: 'enroll',
      method: 'passkey',
    });

    tracker.started();

    expect(trackEvent.mock.calls[0][1]).toMatchObject({
      flow_type: 'enroll',
      methods_required: ['passkey'],
    });
  });

  it('gives every event of a flow the same ID, and each flow its own', () => {
    const first = build();
    const second = build();

    first.tracker.started();
    first.tracker.completed();
    second.tracker.started();

    const [a, b] = first.trackEvent.mock.calls.map(([, p]) => p.flow_id);
    expect(a).toBe(b);
    expect(second.trackEvent.mock.calls[0][1].flow_id).not.toBe(a);
  });

  it('keeps going when the client fails to send', () => {
    const tracker = createMfaTracker({
      reason: { operation: 'vba.verifyEmail' },
      request: { kind: 'enroll', method: 'email_otp' },
      trackEvent: () => {
        throw new Error('analytics down');
      },
    });

    expect(() => tracker.started()).not.toThrow();
  });

  it('sends nothing without a client sender', () => {
    const tracker = createMfaTracker({
      reason: { operation: 'vba.verifyEmail' },
      request: { kind: 'enroll', method: 'email_otp' },
    });

    expect(() => tracker.started()).not.toThrow();
  });

  describe('errorViewed', () => {
    const ERROR_TYPES: [MfaFlowErrorCode, string][] = [
      ['email_claimed', 'email_in_use'],
      ['multi_primary_srp', 'support_required'],
      ['max_identifiers_reached', 'support_required'],
      ['invalid_code', 'incorrect_code'],
      ['server_error', 'generic_error'],
    ];

    it.each(ERROR_TYPES)('groups %s as %s', (code, type) => {
      const { tracker, trackEvent } = build();

      tracker.errorViewed(code, { name: 'emailEntry' });

      expect(trackEvent.mock.calls[0][1]).toMatchObject({
        error_code: code,
        error_type: type,
      });
    });

    it('says whether the failure screen offers to retry', () => {
      const { tracker, trackEvent } = build();

      tracker.errorViewed('server_error', {
        name: 'failure',
        code: 'server_error',
        canRetry: true,
      });

      expect(trackEvent.mock.calls[0][1]).toMatchObject({
        screen_name: 'failure',
        can_retry: true,
      });
    });
  });

  describe('stepViewed', () => {
    const STEPS: [MfaFlowStep, Record<string, unknown>][] = [
      [
        { name: 'emailEntry' },
        { screen_name: 'email_entry', method: 'email_otp' },
      ],
      [
        { name: 'otp', purpose: 'verify', method: 'totp', codeSent: true },
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
        {
          name: 'intro',
          methods: ['email_otp', 'totp'],
          missing: ['totp'],
        } as MfaFlowStep,
        {
          screen_name: 'intro',
          methods_offered: ['email_otp', 'totp'],
          methods_missing: ['totp'],
        },
      ],
    ];

    it.each(STEPS)('describes the %o step', (step, properties) => {
      const { tracker, trackEvent } = build();

      tracker.stepViewed(step);

      expect(trackEvent.mock.calls[0][1]).toMatchObject(properties);
    });

    it('sends nothing for idle, and nothing when the same screen shows again', () => {
      const { tracker, trackEvent } = build();

      tracker.stepViewed({ name: 'idle' });
      tracker.stepViewed({ name: 'emailEntry' });
      tracker.stepViewed({ name: 'emailEntry', prefillEmail: 'a@b.co' });

      expect(trackEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('ended', () => {
    it('ends with the error when the flow fails', () => {
      const { tracker, trackEvent } = build();

      tracker.ended(
        new MfaError('multi_primary_srp', 'blocked'),
        state({
          step: { name: 'failure', code: 'multi_primary_srp', canRetry: false },
        }),
      );

      expect(trackEvent.mock.calls[0][1]).toMatchObject({
        status: 'failed',
        error_code: 'multi_primary_srp',
        error_type: 'support_required',
      });
    });

    it('ends with the screen and the error on it when the user leaves', () => {
      const { tracker, trackEvent } = build();

      tracker.ended(
        new MfaError('flow_cancelled', 'left'),
        state({ error: 'email_claimed' }),
      );

      expect(trackEvent.mock.calls[0][1]).toMatchObject({
        status: 'cancelled',
        screen_name: 'email_entry',
        error_type: 'email_in_use',
      });
    });
  });
});
