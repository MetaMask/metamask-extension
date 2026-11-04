import type { EnrolledCredential } from '@metamask/profile-sync-controller/sdk';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { captureException } from '../../../../shared/lib/sentry';
import { extensionMfaControllerAdapter } from './bindings';
import { startMfaFlow } from './engine/activeFlow';
import { useMfa } from './useMfa';

jest.mock('./engine/activeFlow', () => ({
  startMfaFlow: jest.fn(),
}));

jest.mock('./bindings', () => ({
  extensionMfaControllerAdapter: {},
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

const mockStartMfaFlow = jest.mocked(startMfaFlow);

const enrolledCredentials: EnrolledCredential[] = [
  { id: 'email_otp', type: 'email_otp', status: 'active', verified: true },
];

const renderUseMfa = () =>
  renderHookWithProvider(() => useMfa(), {
    metamask: { isSignedIn: true, enrolledCredentials },
  }).result.current;

describe('useMfa', () => {
  beforeEach(() => {
    mockStartMfaFlow.mockResolvedValue({ credentials: [] });
  });

  it('returns the cached credentials', () => {
    expect(renderUseMfa().credentials).toStrictEqual(enrolledCredentials);
  });

  it('starts a verifyOrEnroll flow on the extension with the feature reason', async () => {
    const reason = { operation: 'vba.activate', enrollDescription: 'Why' };

    await renderUseMfa().verifyOrEnroll({
      reason,
      methods: ['email_otp'],
      verifyWith: 'email_otp',
    });

    expect(mockStartMfaFlow).toHaveBeenCalledWith({
      request: {
        kind: 'verifyOrEnroll',
        methods: ['email_otp'],
        verifyWith: 'email_otp',
      },
      reason,
      platform: 'extension',
      controller: extensionMfaControllerAdapter,
      reportError: expect.any(Function),
    });
  });

  it('starts an enroll flow with the caller reason', async () => {
    const reason = { operation: 'settings.addEmail' };

    await renderUseMfa().enroll({ method: 'email_otp', reason });

    expect(mockStartMfaFlow).toHaveBeenCalledWith({
      request: { kind: 'enroll', method: 'email_otp' },
      reason,
      platform: 'extension',
      controller: extensionMfaControllerAdapter,
      reportError: expect.any(Function),
    });
  });

  it('reports bugs to Sentry with searchable tags', async () => {
    await renderUseMfa().enroll({
      method: 'email_otp',
      reason: { operation: 'settings.addEmail' },
    });
    const { reportError } = mockStartMfaFlow.mock.calls[0][0];
    const error = new Error('bad shape');

    reportError?.(error, {
      code: 'invalid_response',
      operation: 'settings.addEmail',
      step: 'otp',
    });

    expect(captureException).toHaveBeenCalledWith(error, {
      tags: {
        feature: 'mfa',
        mfaCode: 'invalid_response',
        operation: 'settings.addEmail',
      },
      extra: { step: 'otp' },
    });
  });
});
