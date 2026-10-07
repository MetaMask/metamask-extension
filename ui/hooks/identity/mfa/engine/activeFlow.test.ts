import { getMfaErrorCode } from '@metamask/profile-sync-controller/sdk';
import {
  getActiveMfaFlow,
  startMfaFlow,
  subscribeToActiveMfaFlow,
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
