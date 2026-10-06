import { act, renderHook } from '@testing-library/react';
import { startMfaFlow } from './activeFlow';
import type { MfaControllerAdapter } from './types';
import { useActiveMfaFlow } from './useActiveMfaFlow';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const controller: MfaControllerAdapter = {
  refreshEnrolledCredentials: jest.fn(async () => []),
  beginCredentialEnrollment: jest.fn(),
  completeCredentialEnrollment: jest.fn(),
  beginCredentialVerification: jest.fn(),
  completeCredentialVerification: jest.fn(),
  getVerificationToken: jest.fn(async () => null),
  clearVerificationSession: jest.fn(),
};

describe('useActiveMfaFlow', () => {
  it('is undefined when no flow runs', () => {
    const { result } = renderHook(() => useActiveMfaFlow());

    expect(result.current).toBeUndefined();
  });

  it('follows the running flow until it settles', async () => {
    const { result } = renderHook(() => useActiveMfaFlow());

    await act(async () => {
      startMfaFlow({
        request: { kind: 'verifyOrEnroll', methods: ['email_otp'] },
        reason: { operation: 'vba.activate' },
        platform: 'mobile',
        controller,
      }).catch(() => undefined);
      await flush();
    });
    expect(result.current?.state.step).toStrictEqual({
      name: 'intro',
      missing: ['email_otp'],
    });

    await act(async () => {
      result.current?.flow.dispatch({ type: 'continue' });
      await flush();
    });
    expect(result.current?.state.step).toMatchObject({ name: 'emailEntry' });

    await act(async () => {
      result.current?.flow.dispatch({ type: 'cancel' });
      await flush();
    });
    expect(result.current).toBeUndefined();
  });
});
