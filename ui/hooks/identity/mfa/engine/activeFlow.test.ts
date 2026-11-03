/* eslint-disable @typescript-eslint/naming-convention -- Segment properties and the server's codes are snake_case */
import { getMfaErrorCode } from '@metamask/profile-sync-controller/sdk';
import {
  getActiveMfaFlow,
  startMfaFlow,
  subscribeToActiveMfaFlow,
  trackMfaErrorCta,
} from './activeFlow';
import type { MfaControllerAdapter, MfaFlowOptions } from './types';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const buildOptions = (operation: string): MfaFlowOptions => {
  const controller: MfaControllerAdapter = {
    refreshEnrolledCredentials: jest.fn(async () => []),
    beginCredentialEnrollment: jest.fn(async () => ({
      type: 'email_otp' as const,
      flowId: 'flow',
      expiresAt: 0,
    })),
    completeCredentialEnrollment: jest.fn(async () => []),
    beginCredentialVerification: jest.fn(async () => ({
      type: 'email_otp' as const,
      flowId: 'flow',
      expiresAt: 0,
    })),
    completeCredentialVerification: jest.fn(),
    getVerificationToken: jest.fn(async () => null),
    clearVerificationSession: jest.fn(),
  };
  return {
    request: { kind: 'verifyOrEnroll', methods: ['email_otp'] },
    reason: { operation },
    platform: 'mobile',
    controller,
  };
};

describe('startMfaFlow', () => {
  afterEach(async () => {
    getActiveMfaFlow()?.dispatch({ type: 'cancel' });
    await flush();
  });

  it('exposes the running flow and notifies subscribers', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToActiveMfaFlow(listener);

    startMfaFlow(buildOptions('vba.activate')).catch(() => undefined);
    await flush();

    expect(getActiveMfaFlow()?.reason.operation).toBe('vba.activate');
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('joins the pending flow for the same operation', async () => {
    const first = startMfaFlow(buildOptions('vba.activate'));
    const second = startMfaFlow(buildOptions('vba.activate'));

    expect(second).toBe(first);
    first.catch(() => undefined);
  });

  it('rejects a flow for another operation while one is pending', async () => {
    startMfaFlow(buildOptions('vba.activate')).catch(() => undefined);

    await expect(
      startMfaFlow(buildOptions('kalshi.deposit')).catch(getMfaErrorCode),
    ).resolves.toBe('flow_in_progress');
  });

  it('rejects a different request for the same operation', async () => {
    startMfaFlow(buildOptions('vba.activate')).catch(() => undefined);

    await expect(
      startMfaFlow({
        ...buildOptions('vba.activate'),
        request: {
          kind: 'verifyOrEnroll',
          methods: ['email_otp'],
          verifyWith: 'email_otp',
        },
      }).catch(getMfaErrorCode),
    ).resolves.toBe('flow_in_progress');
  });

  it('clears the active flow once it settles', async () => {
    startMfaFlow(buildOptions('vba.activate')).catch(() => undefined);
    await flush();

    getActiveMfaFlow()?.dispatch({ type: 'cancel' });
    await flush();

    expect(getActiveMfaFlow()).toBeUndefined();
  });
});

describe('startMfaFlow analytics', () => {
  const baseProperties = {
    flow_id: expect.any(String),
    entry_point: 'vba',
    operation: 'vba.verifyEmail',
    flow_type: 'verify_or_enroll',
    methods_required: ['email_otp'],
  };

  afterEach(async () => {
    getActiveMfaFlow()?.dispatch({ type: 'cancel' });
    await flush();
  });

  it('tracks the start, each new screen and the end of a flow', async () => {
    const trackEvent = jest.fn();
    startMfaFlow({ ...buildOptions('vba.verifyEmail'), trackEvent }).catch(
      () => undefined,
    );
    await flush();

    expect(trackEvent).toHaveBeenNthCalledWith(1, 'MFA Flow Status Updated', {
      ...baseProperties,
      status: 'started',
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, 'MFA Step Viewed', {
      ...baseProperties,
      screen_name: 'intro',
      methods_offered: ['email_otp'],
      methods_missing: ['email_otp'],
    });
    expect(trackEvent).toHaveBeenCalledTimes(2);

    getActiveMfaFlow()?.dispatch({ type: 'cancel' });
    await flush();

    expect(trackEvent).toHaveBeenLastCalledWith('MFA Flow Status Updated', {
      ...baseProperties,
      status: 'cancelled',
      screen_name: 'intro',
    });
    const flowIds = trackEvent.mock.calls.map(
      ([, properties]) => properties.flow_id,
    );
    expect(new Set(flowIds).size).toBe(1);
  });

  it('gives each flow its own ID', async () => {
    const trackEvent = jest.fn();
    for (const operation of ['vba.verifyEmail', 'settings.addEmail']) {
      startMfaFlow({ ...buildOptions(operation), trackEvent }).catch(
        () => undefined,
      );
      await flush();
      getActiveMfaFlow()?.dispatch({ type: 'cancel' });
      await flush();
    }

    const flowIds = trackEvent.mock.calls.map(
      ([, properties]) => properties.flow_id,
    );
    expect(new Set(flowIds).size).toBe(2);
  });

  it('adds the base properties to events sent from the screens', async () => {
    const trackEvent = jest.fn();
    startMfaFlow({ ...buildOptions('vba.verifyEmail'), trackEvent }).catch(
      () => undefined,
    );
    await flush();

    trackMfaErrorCta('email_claimed', 'learn_more');

    expect(trackEvent).toHaveBeenLastCalledWith('MFA Error CTA Clicked', {
      ...baseProperties,
      error_code: 'email_claimed',
      error_type: 'email_in_use',
      cta_type: 'learn_more',
    });
  });

  it('tracks nothing for a request that joins the running flow', async () => {
    const trackEvent = jest.fn();
    startMfaFlow(buildOptions('vba.verifyEmail')).catch(() => undefined);
    startMfaFlow({ ...buildOptions('vba.verifyEmail'), trackEvent }).catch(
      () => undefined,
    );
    await flush();

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('keeps the flow running when analytics throws', async () => {
    const trackEvent = jest.fn(() => {
      throw new Error('analytics down');
    });
    startMfaFlow({ ...buildOptions('vba.verifyEmail'), trackEvent }).catch(
      () => undefined,
    );
    await flush();

    expect(getActiveMfaFlow()?.getState().step.name).toBe('intro');
  });
});
