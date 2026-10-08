import { act, renderHook, waitFor } from '@testing-library/react';
import { getActiveMfaFlow, startMfaFlow } from './activeFlow';
import type { MfaControllerAdapter } from './types';
import { useActiveMfaFlow } from './useActiveMfaFlow';

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
  afterEach(async () => {
    const flow = getActiveMfaFlow();
    await act(async () => {
      flow?.dispatch({ type: 'cancel' });
      await flow?.result.catch(() => undefined);
    });
  });

  it('is undefined when no flow runs', () => {
    const { result } = renderHook(() => useActiveMfaFlow());

    expect(result.current).toBeUndefined();
  });

  it('follows the running flow until it settles', async () => {
    const { result } = renderHook(() => useActiveMfaFlow());

    act(() => {
      startMfaFlow({
        request: { kind: 'verifyOrEnroll', methods: ['email_otp'] },
        reason: { operation: 'vba.activate' },
        platform: 'mobile',
        controller,
      }).catch(() => undefined);
    });
    await waitFor(() =>
      expect(result.current?.state.step).toStrictEqual({
        name: 'intro',
        missing: ['email_otp'],
      }),
    );

    act(() => {
      result.current?.flow.dispatch({ type: 'continue' });
    });
    await waitFor(() =>
      expect(result.current?.state.step).toMatchObject({ name: 'emailEntry' }),
    );

    act(() => {
      result.current?.flow.dispatch({ type: 'cancel' });
    });
    await waitFor(() => expect(result.current).toBeUndefined());
  });
});
