import type { EnrolledCredential } from '@metamask/profile-sync-controller/sdk';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { captureException } from '../../../../shared/lib/sentry';
import {
  createSocialLoginControllerAdapter,
  extensionMfaControllerAdapter,
} from './bindings';
import { startMfaFlow } from './engine/activeFlow';
import type { MfaControllerAdapter, MfaReason } from './engine/types';
import { useMfa } from './useMfa';

const mockTrackEvent = jest.fn(async () => undefined);
jest.mock('../../useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
    createEventBuilder: jest.requireActual(
      '../../../../shared/lib/analytics/create-event-builder',
    ).createEventBuilder,
  }),
}));

jest.mock('./engine/activeFlow', () => ({
  startMfaFlow: jest.fn(),
}));

jest.mock('./bindings', () => ({
  extensionMfaControllerAdapter: {},
  createSocialLoginControllerAdapter: jest.fn(),
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

const mockStartMfaFlow = jest.mocked(startMfaFlow);
const mockRefreshSocialCredentials = jest.fn();
const socialLoginController = {
  refreshEnrolledCredentials: mockRefreshSocialCredentials,
} as unknown as MfaControllerAdapter;

const enrolledCredentials: EnrolledCredential[] = [
  { id: 'email_otp', type: 'email_otp', status: 'active', verified: true },
];

const renderUseMfa = () =>
  renderHookWithProvider(() => useMfa(), {
    metamask: { isSignedIn: true, enrolledCredentials },
  }).result.current;

describe('useMfa', () => {
  beforeEach(() => {
    mockStartMfaFlow.mockClear();
    mockStartMfaFlow.mockResolvedValue({ credentials: [] });
    jest.mocked(createSocialLoginControllerAdapter).mockClear();
    jest
      .mocked(createSocialLoginControllerAdapter)
      .mockReturnValue(socialLoginController);
  });

  it('returns the cached credentials', () => {
    expect(renderUseMfa().credentials).toStrictEqual(enrolledCredentials);
  });

  it('starts a verifyOrEnroll flow on the extension with the feature reason', async () => {
    const reason: MfaReason = {
      operation: 'vba.activate',
      enrollDescription: 'Why',
    };

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
      trackEvent: expect.any(Function),
    });
  });

  it('starts an enroll flow with the caller reason', async () => {
    const reason: MfaReason = { operation: 'settings.addEmail' };

    await renderUseMfa().enroll({ method: 'email_otp', reason });

    expect(mockStartMfaFlow).toHaveBeenCalledWith({
      request: { kind: 'enroll', method: 'email_otp' },
      reason,
      platform: 'extension',
      controller: extensionMfaControllerAdapter,
      reportError: expect.any(Function),
      trackEvent: expect.any(Function),
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

  it('sends the kit events as MetaMetrics events', async () => {
    await renderUseMfa().enroll({
      method: 'email_otp',
      reason: { operation: 'settings.addEmail' },
    });
    const { trackEvent } = mockStartMfaFlow.mock.calls[0][0];

    trackEvent?.('MFA Flow Status Updated', { status: 'started' });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MFA Flow Status Updated',
        properties: expect.objectContaining({
          category: 'Auth',
          status: 'started',
        }),
      }),
    );
  });

  describe('verifyForSocialLogin', () => {
    const reason: MfaReason = { operation: 'qa.socialLogin' };

    it('rejects without starting a flow when no method is active', async () => {
      mockRefreshSocialCredentials.mockResolvedValue([
        { id: 'p', type: 'email_otp', status: 'pending', verified: false },
      ] as EnrolledCredential[]);

      await expect(
        renderUseMfa().verifyForSocialLogin({ reason }),
      ).rejects.toMatchObject({ mfaCode: 'credential_not_enrolled' });
      expect(mockStartMfaFlow).not.toHaveBeenCalled();
    });

    it('verifies with every active method through the social login adapter', async () => {
      mockRefreshSocialCredentials.mockResolvedValue([
        { id: 't', type: 'totp', status: 'active', verified: true },
        { id: 'e', type: 'email_otp', status: 'active', verified: true },
      ] as EnrolledCredential[]);

      await renderUseMfa().verifyForSocialLogin({ reason });

      expect(mockStartMfaFlow).toHaveBeenCalledWith({
        request: {
          kind: 'verifyOrEnroll',
          methods: ['totp', 'email_otp'],
          verifyWith: ['totp', 'email_otp'],
        },
        reason,
        platform: 'extension',
        controller: socialLoginController,
        reportError: expect.any(Function),
        trackEvent: expect.any(Function),
      });
    });

    it('uses a new adapter for each verification', async () => {
      mockRefreshSocialCredentials.mockResolvedValue(
        enrolledCredentials as EnrolledCredential[],
      );

      await renderUseMfa().verifyForSocialLogin({ reason });
      await renderUseMfa().verifyForSocialLogin({ reason });

      expect(createSocialLoginControllerAdapter).toHaveBeenCalledTimes(2);
    });

    it('leaves out methods this platform cannot run', async () => {
      mockRefreshSocialCredentials.mockResolvedValue([
        { id: 'k', type: 'passkey', status: 'active', verified: true },
        { id: 'e', type: 'email_otp', status: 'active', verified: true },
      ] as EnrolledCredential[]);

      await renderUseMfa().verifyForSocialLogin({ reason });

      expect(mockStartMfaFlow.mock.calls[0][0].request).toStrictEqual({
        kind: 'verifyOrEnroll',
        methods: ['email_otp'],
        verifyWith: ['email_otp'],
      });
    });
  });
});
