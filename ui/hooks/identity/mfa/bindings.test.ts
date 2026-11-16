import {
  getMfaErrorCode,
  type BeginVerificationRequest,
  type CompleteVerificationRequest,
} from '@metamask/profile-sync-controller/sdk';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  createSocialLoginControllerAdapter,
  extensionMfaControllerAdapter,
} from './bindings';
import type { MfaControllerAdapter } from './engine/types';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('extensionMfaControllerAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the AuthenticationController through the background', async () => {
    const request = {
      type: 'email_otp' as const,
      email: 'a@b.co',
      reason: { operation: 'qa.test' },
    };
    const response = { type: 'email_otp', flowId: 'flow-1', expiresAt: 1 };
    mockSubmitRequestToBackground.mockResolvedValue(response);

    expect(
      await extensionMfaControllerAdapter.beginCredentialEnrollment(request),
    ).toBe(response);
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'messengerCall',
      ['AuthenticationController:beginCredentialEnrollment', [request]],
    );
  });

  it('forwards getVerificationToken with its request', async () => {
    mockSubmitRequestToBackground.mockResolvedValue(null);

    expect(
      await extensionMfaControllerAdapter.getVerificationToken({
        maxSessionAgeMs: 1000,
      }),
    ).toBeNull();
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'messengerCall',
      [
        'AuthenticationController:getVerificationToken',
        [{ maxSessionAgeMs: 1000 }],
      ],
    );
  });

  it('forwards clearVerificationSession without arguments', async () => {
    mockSubmitRequestToBackground.mockResolvedValue(undefined);

    await extensionMfaControllerAdapter.clearVerificationSession();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'messengerCall',
      ['AuthenticationController:clearVerificationSession', []],
    );
  });
});

describe('createSocialLoginControllerAdapter', () => {
  let socialLoginControllerAdapter: MfaControllerAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    socialLoginControllerAdapter = createSocialLoginControllerAdapter();
  });

  const beginRequest: BeginVerificationRequest = {
    type: 'email_otp',
    reason: { operation: 'qa.test' },
  };
  const completeRequest: CompleteVerificationRequest = {
    flowId: 'flow-1',
    proof: { type: 'email_otp', code: '123456' },
    reason: { operation: 'qa.test' },
  };
  const ROUTES: [string, string, () => Promise<unknown>, unknown[]][] = [
    [
      'refreshEnrolledCredentials',
      'refreshSocialLoginCredentials',
      () => socialLoginControllerAdapter.refreshEnrolledCredentials(),
      [],
    ],
    [
      'beginCredentialVerification',
      'beginSocialLoginVerification',
      () =>
        socialLoginControllerAdapter.beginCredentialVerification(beginRequest),
      [beginRequest],
    ],
    [
      'completeCredentialVerification',
      'completeSocialLoginVerification',
      () =>
        socialLoginControllerAdapter.completeCredentialVerification(
          completeRequest,
        ),
      [completeRequest],
    ],
  ];

  for (const [method, action, call, args] of ROUTES) {
    it(`routes ${method} to the locked-only ${action} action`, async () => {
      const response = { ok: true };
      mockSubmitRequestToBackground.mockResolvedValue(response);

      expect(await call()).toBe(response);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'messengerCall',
        [`AuthenticationController:${action}`, args],
      );
    });
  }

  it('rejects enrollment without calling the background', async () => {
    const rejections = await Promise.allSettled([
      socialLoginControllerAdapter.beginCredentialEnrollment(
        {} as Parameters<
          typeof socialLoginControllerAdapter.beginCredentialEnrollment
        >[0],
      ),
      socialLoginControllerAdapter.completeCredentialEnrollment(
        {} as Parameters<
          typeof socialLoginControllerAdapter.completeCredentialEnrollment
        >[0],
      ),
    ]);

    rejections.forEach((result) => {
      expect(result.status).toBe('rejected');
      expect(getMfaErrorCode((result as PromiseRejectedResult).reason)).toBe(
        'invalid_request',
      );
    });
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  describe('verification token', () => {
    const NOW = 1_800_000_000_000;
    const token = {
      accessToken: 'token',
      expiresIn: 900,
      obtainedAt: NOW,
      claims: { sub: 'profile', amr: ['email_otp'], exp: NOW / 1000 + 900 },
    };
    let nowSpy: jest.SpyInstance<number, []>;

    beforeEach(() => {
      // Created per test: the Jest config restores spies between tests.
      nowSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW);
      mockSubmitRequestToBackground.mockResolvedValue(token);
    });

    afterEach(() => {
      nowSpy.mockRestore();
    });

    it('has none before a verification completes', async () => {
      expect(
        await socialLoginControllerAdapter.getVerificationToken(),
      ).toBeNull();
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('returns the token a completed verification earned, without asking the background', async () => {
      await socialLoginControllerAdapter.completeCredentialVerification(
        completeRequest,
      );

      expect(await socialLoginControllerAdapter.getVerificationToken()).toBe(
        token,
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    });

    it('drops the token once it has expired', async () => {
      await socialLoginControllerAdapter.completeCredentialVerification(
        completeRequest,
      );
      nowSpy.mockReturnValue(NOW + token.expiresIn * 1000);

      expect(
        await socialLoginControllerAdapter.getVerificationToken(),
      ).toBeNull();
    });

    it('applies the caller max session age without dropping the token', async () => {
      await socialLoginControllerAdapter.completeCredentialVerification(
        completeRequest,
      );
      nowSpy.mockReturnValue(NOW + 5000);

      expect(
        await socialLoginControllerAdapter.getVerificationToken({
          maxSessionAgeMs: 5000,
        }),
      ).toBeNull();
      expect(
        await socialLoginControllerAdapter.getVerificationToken({
          maxSessionAgeMs: 5001,
        }),
      ).toBe(token);
    });

    it('forgets the token when the session is cleared', async () => {
      await socialLoginControllerAdapter.completeCredentialVerification(
        completeRequest,
      );

      await socialLoginControllerAdapter.clearVerificationSession();

      expect(
        await socialLoginControllerAdapter.getVerificationToken(),
      ).toBeNull();
    });

    it('does not share a token with another adapter', async () => {
      await socialLoginControllerAdapter.completeCredentialVerification(
        completeRequest,
      );

      expect(
        await createSocialLoginControllerAdapter().getVerificationToken(),
      ).toBeNull();
    });
  });
});
