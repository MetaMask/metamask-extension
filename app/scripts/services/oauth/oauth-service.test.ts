import {
  Env as ProfileSyncEnv,
  getEnvUrls,
} from '@metamask/profile-sync-controller/sdk';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';
import browser from 'webextension-polyfill';
import { OAuthErrorMessages } from '../../../../shared/lib/error';
import { ENVIRONMENT } from '../../../../shared/constants/build';
import { AuthConnection } from '../../../../shared/constants/onboarding';
import ExtensionPlatform from '../../platforms/extension';
import { OAuthServiceMessenger, WebAuthenticator } from './types';
import { OAuthService } from './oauth-service';
import { createLoginHandler } from './create-login-handler';
import { loadOAuthConfig } from './config';

type Actions = MessengerActions<OAuthServiceMessenger>;

type Events = MessengerEvents<OAuthServiceMessenger>;

type RootMessenger = Messenger<MockAnyNamespace, Actions, Events>;

type OAuthServiceTestMessenger = OAuthServiceMessenger & {
  captureException?: jest.Mock;
};

const mockBrowserRuntime = browser.runtime as typeof browser.runtime & {
  lastError?: { message: string; stack?: string[] };
};

const MOCK_GOOGLE_CLIENT_ID = 'mock-google-client-id';
const MOCK_APPLE_CLIENT_ID = 'mock-apple-client-id';
const MOCK_TELEGRAM_CLIENT_ID = 'mock-telegram-client-id';
const MOCK_USER_ID = 'user-id';
const MOCK_REDIRECT_URI = 'https://mocked-redirect-uri';
const MOCK_PROFILE_SYNC_ENV = ProfileSyncEnv.DEV;
const MOCK_TELEGRAM_AUTH_API_URL = getEnvUrls(MOCK_PROFILE_SYNC_ENV).authApiUrl;
const MOCK_JWT_TOKEN =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN3bmFtOTA5QGdtYWlsLmNvbSIsInN1YiI6InN3bmFtOTA5QGdtYWlsLmNvbSIsImlzcyI6Im1ldGFtYXNrIiwiYXVkIjoibWV0YW1hc2siLCJpYXQiOjE3NDUyMDc1NjYsImVhdCI6MTc0NTIwNzg2NiwiZXhwIjoxNzQ1MjA3ODY2fQ.nXRRLB7fglRll7tMzFFCU0u7Pu6EddqEYf_DMyRgOENQ6tJ8OLtVknNf83_5a67kl_YKHFO-0PEjvJviPID6xg';
const MOCK_NONCE = 'mocked-nonce';
const MOCK_STATE = JSON.stringify({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line camelcase, @typescript-eslint/naming-convention
  client_redirect_back_uri: MOCK_REDIRECT_URI,
  nonce: MOCK_NONCE,
});

jest.mock('../../platforms/extension');

function getOAuthLoginEnvs(): {
  googleClientId: string;
  appleClientId: string;
  telegramClientId: string;
  profileSyncEnv: ProfileSyncEnv;
} {
  return {
    googleClientId: MOCK_GOOGLE_CLIENT_ID,
    appleClientId: MOCK_APPLE_CLIENT_ID,
    telegramClientId: MOCK_TELEGRAM_CLIENT_ID,
    profileSyncEnv: MOCK_PROFILE_SYNC_ENV,
  };
}

function getMessenger({
  captureException,
}: {
  captureException?: jest.Mock;
} = {}): OAuthServiceTestMessenger {
  const rootMessenger: RootMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });
  const messenger = new Messenger({
    namespace: 'OAuthService',
    parent: rootMessenger,
  }) as OAuthServiceTestMessenger;

  messenger.captureException = captureException;

  return messenger;
}

const getRedirectUrlSpy = jest.fn().mockReturnValue(MOCK_REDIRECT_URI);
const launchWebAuthFlowSpy = jest.fn().mockImplementation((_options, cb) => {
  return cb(`${MOCK_REDIRECT_URI}?code=mocked-code&state=${MOCK_STATE}`);
});
const generateCodeVerifierAndChallengeSpy = jest.fn().mockResolvedValue({
  codeVerifier: 'mocked-code-verifier',
  challenge: 'mocked-code-verifier-challenge',
});
const generateNonceSpy = jest.fn().mockReturnValue(MOCK_NONCE);

const mockWebAuthenticator: WebAuthenticator = {
  getRedirectURL: getRedirectUrlSpy,
  launchWebAuthFlow: launchWebAuthFlowSpy,
  generateCodeVerifierAndChallenge: generateCodeVerifierAndChallengeSpy,
  generateNonce: generateNonceSpy,
};

const mockBufferedTrace = jest.fn();
const mockBufferedEndTrace = jest.fn();
const mockTrackEvent = jest.fn();
const mockAddEventBeforeMetricsOptIn = jest.fn();
const mockGetParticipateInMetaMetrics = jest.fn().mockReturnValue(true);
const mockPlatform = new ExtensionPlatform();

describe('OAuthService - startOAuthLogin', () => {
  let originalTelegramLoginEnabled: string | undefined;

  beforeAll(() => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;
    originalTelegramLoginEnabled = process.env.TELEGRAM_LOGIN_ENABLED;
    process.env.TELEGRAM_LOGIN_ENABLED = 'true';
  });

  afterAll(() => {
    process.env.TELEGRAM_LOGIN_ENABLED = originalTelegramLoginEnabled;
  });

  beforeEach(() => {
    mockBrowserRuntime.lastError = undefined;

    // mock the fetch call to auth-server
    jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() => {
        return Promise.resolve({
          json: jest.fn().mockResolvedValue({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            verifier_id: MOCK_USER_ID,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            id_token: MOCK_JWT_TOKEN,
          }),
          status: 200,
          ok: true,
        });
      }) as jest.Mock,
    );
  });

  afterEach(() => {
    mockBrowserRuntime.lastError = undefined;
    jest.clearAllMocks();
  });

  it('should start the OAuth login process with `Google`', async () => {
    const messenger = getMessenger();
    const oauthEnv = getOAuthLoginEnvs();

    const oauthService = new OAuthService({
      messenger,
      env: oauthEnv,
      webAuthenticator: mockWebAuthenticator,
      platform: mockPlatform,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
    });

    await oauthService.startOAuthLogin(AuthConnection.Google);

    const googleLoginHandler = createLoginHandler(
      AuthConnection.Google,
      {
        ...oauthEnv,
        ...loadOAuthConfig(),
      },
      mockWebAuthenticator,
    );

    expect(launchWebAuthFlowSpy).toHaveBeenCalledWith(
      {
        interactive: true,
        url: await googleLoginHandler.getAuthUrl(),
      },
      expect.any(Function),
    );
  });

  it('should start the OAuth login process with `Apple`', async () => {
    const messenger = getMessenger();

    const oauthEnv = getOAuthLoginEnvs();

    const oauthService = new OAuthService({
      messenger,
      env: oauthEnv,
      webAuthenticator: mockWebAuthenticator,
      platform: mockPlatform,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
    });

    await oauthService.startOAuthLogin(AuthConnection.Apple);

    const appleLoginHandler = createLoginHandler(
      AuthConnection.Apple,
      {
        ...oauthEnv,
        ...loadOAuthConfig(),
      },
      mockWebAuthenticator,
    );

    expect(launchWebAuthFlowSpy).toHaveBeenCalledWith(
      {
        interactive: true,
        url: await appleLoginHandler.getAuthUrl(),
      },
      expect.any(Function),
    );
  });

  it('should start the OAuth login process with `Telegram` using extension platform tabs', async () => {
    const messenger = getMessenger();
    const oauthEnv = getOAuthLoginEnvs();
    const redirectUrl = `${MOCK_REDIRECT_URI}?code=mocked-code&state=${MOCK_NONCE}`;

    jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn((input) => {
        const url = String(input);

        if (url.includes('/api/v2/telegram/login/verify')) {
          return Promise.resolve({
            json: jest.fn().mockResolvedValue({
              token: MOCK_JWT_TOKEN,
            }),
            status: 200,
            ok: true,
          });
        }

        if (url.includes('/oauth2/token')) {
          return Promise.resolve({
            json: jest.fn().mockResolvedValue({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              access_token: 'mocked-oidc-access-token',
            }),
            status: 200,
            ok: true,
          });
        }

        if (url.includes('/api/v1/oauth/mint')) {
          return Promise.resolve({
            json: jest.fn().mockResolvedValue({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              id_token: MOCK_JWT_TOKEN,
            }),
            status: 200,
            ok: true,
          });
        }

        throw new Error(`Unexpected fetch URL: ${url}`);
      }) as jest.Mock,
    );

    // @ts-expect-error - mock platform
    jest.spyOn(mockPlatform, 'openTab').mockResolvedValue({ id: 1 });
    jest.spyOn(mockPlatform, 'closeTab').mockResolvedValue(undefined);
    jest
      .spyOn(mockPlatform, 'addTabUpdatedListener')
      .mockImplementation(async (fn) => {
        await Promise.resolve();
        await fn(1, { url: redirectUrl }, { url: redirectUrl });
      });
    jest
      .spyOn(mockPlatform, 'addTabRemovedListener')
      .mockImplementation(jest.fn());

    const oauthService = new OAuthService({
      messenger,
      env: oauthEnv,
      webAuthenticator: mockWebAuthenticator,
      platform: mockPlatform,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
    });

    const result = await oauthService.startOAuthLogin(AuthConnection.Telegram);

    expect(result).toMatchObject({
      authConnection: AuthConnection.Telegram,
      idTokens: [MOCK_JWT_TOKEN],
      socialLoginEmail: 'swnam909@gmail.com',
      profilePairingToken: 'mocked-oidc-access-token',
    });
    expect(mockPlatform.openTab).toHaveBeenCalledWith({
      active: true,
      url: expect.stringContaining(
        `${MOCK_TELEGRAM_AUTH_API_URL}/api/v2/telegram/login/initiate`,
      ),
    });
    expect(mockPlatform.closeTab).toHaveBeenCalledWith(1);
  });

  it('uses an empty auth code when the Telegram redirect URL has no code parameter', async () => {
    const messenger = getMessenger();
    const oauthEnv = getOAuthLoginEnvs();
    const redirectUrl = `${MOCK_REDIRECT_URI}?state=${MOCK_NONCE}`;
    const verifyRequestBodies: Record<string, string | null>[] = [];

    (global.fetch as jest.Mock).mockImplementation(
      jest.fn((input, init?: RequestInit) => {
        const url = String(input);

        if (url.includes('/api/v2/telegram/login/verify')) {
          if (typeof init?.body !== 'string') {
            throw new Error(
              'Expected Telegram verify request body to be a string',
            );
          }

          verifyRequestBodies.push(
            JSON.parse(init.body) as Record<string, string | null>,
          );

          return Promise.resolve({
            json: jest.fn().mockResolvedValue({
              token: MOCK_JWT_TOKEN,
            }),
            status: 200,
            ok: true,
          });
        }

        if (url.includes('/oauth2/token')) {
          return Promise.resolve({
            json: jest.fn().mockResolvedValue({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              access_token: 'mocked-oidc-access-token',
            }),
            status: 200,
            ok: true,
          });
        }

        if (url.includes('/api/v1/oauth/mint')) {
          return Promise.resolve({
            json: jest.fn().mockResolvedValue({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              id_token: MOCK_JWT_TOKEN,
            }),
            status: 200,
            ok: true,
          });
        }

        throw new Error(`Unexpected fetch URL: ${url}`);
      }) as jest.Mock,
    );

    // @ts-expect-error - mock platform
    jest.spyOn(mockPlatform, 'openTab').mockResolvedValue({ id: 1 });
    jest.spyOn(mockPlatform, 'closeTab').mockResolvedValue(undefined);
    jest
      .spyOn(mockPlatform, 'addTabUpdatedListener')
      .mockImplementation(async (fn) => {
        await Promise.resolve();
        await fn(1, { url: redirectUrl }, { url: redirectUrl });
      });
    jest
      .spyOn(mockPlatform, 'addTabRemovedListener')
      .mockImplementation(jest.fn());

    const oauthService = new OAuthService({
      messenger,
      env: oauthEnv,
      webAuthenticator: mockWebAuthenticator,
      platform: mockPlatform,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
    });

    await oauthService.startOAuthLogin(AuthConnection.Telegram);

    expect(verifyRequestBodies).toHaveLength(1);
    expect(verifyRequestBodies[0].code).toBe('');
    expect(verifyRequestBodies[0].code).not.toBeNull();
    expect(verifyRequestBodies[0].code_verifier).toBe('mocked-code-verifier');
  });

  it('treats a closed Telegram login tab as a user-cancelled login', async () => {
    const captureException = jest.fn();
    const messenger = getMessenger({ captureException });
    const oauthEnv = getOAuthLoginEnvs();

    // @ts-expect-error - mock platform
    jest.spyOn(mockPlatform, 'openTab').mockResolvedValue({ id: 1 });
    jest.spyOn(mockPlatform, 'closeTab').mockResolvedValue(undefined);
    jest
      .spyOn(mockPlatform, 'addTabUpdatedListener')
      .mockImplementation(jest.fn());
    jest
      .spyOn(mockPlatform, 'addTabRemovedListener')
      .mockImplementation(async (fn) => {
        await Promise.resolve();
        await fn(1);
      });

    const oauthService = new OAuthService({
      messenger,
      env: oauthEnv,
      webAuthenticator: mockWebAuthenticator,
      platform: mockPlatform,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
    });

    await expect(
      oauthService.startOAuthLogin(AuthConnection.Telegram),
    ).rejects.toThrow(OAuthErrorMessages.USER_CANCELLED_LOGIN_ERROR);

    expect(captureException).not.toHaveBeenCalled();
    expect(mockPlatform.closeTab).not.toHaveBeenCalled();
  });

  it('should throw an error if the state validation fails - google', async () => {
    const captureException = jest.fn();
    const messenger = getMessenger({ captureException });

    const oauthEnv = getOAuthLoginEnvs();

    const oauthService = new OAuthService({
      messenger,
      env: oauthEnv,
      webAuthenticator: {
        ...mockWebAuthenticator,
        generateNonce: jest.fn().mockReturnValue(Math.random().toString()),
      },
      platform: mockPlatform,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
    });

    await expect(
      oauthService.startOAuthLogin(AuthConnection.Google),
    ).rejects.toThrow(OAuthErrorMessages.INVALID_OAUTH_STATE_ERROR);

    expect(captureException).toHaveBeenCalledTimes(1);
    const sentryError = captureException.mock.calls[0][0] as Error & {
      cause?: Error;
    };

    expect(sentryError.message).toContain(AuthConnection.Google);
    expect(sentryError.message).not.toContain(MOCK_REDIRECT_URI);
    expect(sentryError.cause?.message).toBe(
      OAuthErrorMessages.INVALID_OAUTH_STATE_ERROR,
    );
  });

  it('preserves the browser auth flow error for sentry when no redirect URL is returned', async () => {
    const ErrorUtils = jest.requireActual<
      typeof import('../../../../shared/lib/error')
    >('../../../../shared/lib/error');
    const createSentryErrorSpy = jest.spyOn(ErrorUtils, 'createSentryError');
    const captureException = jest.fn();
    const messenger = getMessenger({ captureException });
    const browserAuthFlowErrorMessage =
      'Authorization page could not be loaded';
    mockBrowserRuntime.lastError = {
      message: browserAuthFlowErrorMessage,
    };

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: {
        ...mockWebAuthenticator,
        launchWebAuthFlow: jest.fn().mockImplementation((_options, cb) => {
          cb(undefined);
        }),
      },
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
      platform: mockPlatform,
    });

    await expect(
      oauthService.startOAuthLogin(AuthConnection.Google),
    ).rejects.toThrow(browserAuthFlowErrorMessage);

    const sentryError = captureException.mock.calls[0][0] as Error & {
      cause?: Error & { cause?: Error };
    };

    expect(sentryError.cause?.message).toBe(browserAuthFlowErrorMessage);
    expect(sentryError.cause?.cause?.message).toBe(browserAuthFlowErrorMessage);
    expect(sentryError.message).toContain(AuthConnection.Google);
    expect(sentryError.message).not.toContain(MOCK_REDIRECT_URI);
    expect(createSentryErrorSpy).toHaveBeenCalledTimes(1);
    expect(createSentryErrorSpy).not.toHaveBeenCalledWith(
      OAuthErrorMessages.NO_REDIRECT_URL_FOUND_ERROR,
      expect.anything(),
    );

    createSentryErrorSpy.mockRestore();
  });

  it('falls back to the generic no redirect error when the browser reports no lastError', async () => {
    const captureException = jest.fn();
    const messenger = getMessenger({ captureException });

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: {
        ...mockWebAuthenticator,
        launchWebAuthFlow: jest.fn().mockImplementation((_options, cb) => {
          cb(undefined);
        }),
      },
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
      platform: mockPlatform,
    });

    await expect(
      oauthService.startOAuthLogin(AuthConnection.Google),
    ).rejects.toThrow(OAuthErrorMessages.NO_REDIRECT_URL_FOUND_ERROR);

    const sentryError = captureException.mock.calls[0][0] as Error & {
      cause?: Error & { cause?: Error };
    };

    expect(sentryError.cause?.message).toBe(
      OAuthErrorMessages.NO_REDIRECT_URL_FOUND_ERROR,
    );
    expect(sentryError.cause?.cause).toBeUndefined();
    expect(sentryError.message).toContain(AuthConnection.Google);
    expect(sentryError.message).not.toContain(MOCK_REDIRECT_URI);
  });

  it('falls back to the generic no redirect error when the browser reports an empty lastError message', async () => {
    const captureException = jest.fn();
    const messenger = getMessenger({ captureException });
    mockBrowserRuntime.lastError = {
      message: '',
    };

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: {
        ...mockWebAuthenticator,
        launchWebAuthFlow: jest.fn().mockImplementation((_options, cb) => {
          cb(undefined);
        }),
      },
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
      platform: mockPlatform,
    });

    await expect(
      oauthService.startOAuthLogin(AuthConnection.Google),
    ).rejects.toThrow(OAuthErrorMessages.NO_REDIRECT_URL_FOUND_ERROR);

    const sentryError = captureException.mock.calls[0][0] as Error & {
      cause?: Error & { cause?: Error };
    };

    expect(sentryError.cause?.message).toBe(
      OAuthErrorMessages.NO_REDIRECT_URL_FOUND_ERROR,
    );
    expect(sentryError.cause?.cause?.message).toBe('');
    expect(sentryError.message).toContain(AuthConnection.Google);
    expect(sentryError.message).not.toContain(MOCK_REDIRECT_URI);
  });

  describe('OAuthService:startOAuthLogin action', () => {
    it('starts the OAuth login process with `Google`', async () => {
      const messenger = getMessenger();

      const oauthEnv = getOAuthLoginEnvs();

      // eslint-disable-next-line no-new
      new OAuthService({
        messenger,
        env: oauthEnv,
        webAuthenticator: mockWebAuthenticator,
        platform: mockPlatform,
        bufferedTrace: mockBufferedTrace,
        bufferedEndTrace: mockBufferedEndTrace,
        trackEvent: mockTrackEvent,
        addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
        getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
      });

      await messenger.call(
        'OAuthService:startOAuthLogin',
        AuthConnection.Google,
      );

      const googleLoginHandler = createLoginHandler(
        AuthConnection.Google,
        {
          ...oauthEnv,
          ...loadOAuthConfig(),
        },
        mockWebAuthenticator,
      );

      expect(launchWebAuthFlowSpy).toHaveBeenCalledWith(
        {
          interactive: true,
          url: await googleLoginHandler.getAuthUrl(),
        },
        expect.any(Function),
      );
    });
  });
});

describe('OAuthService - getNewRefreshToken', () => {
  it('should be able to get new refresh token', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() => {
        return Promise.resolve({
          json: jest.fn().mockResolvedValue({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            id_token: 'MOCK_NEW_JWT_TOKEN',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            refresh_token: 'MOCK_NEW_REFRESH_TOKEN',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            revoke_token: 'MOCK_NEW_REVOKE_TOKEN',
          }),
          status: 200,
          ok: true,
        });
      }) as jest.Mock,
    );

    const messenger = getMessenger();

    const oauthConfig = loadOAuthConfig();

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
      platform: mockPlatform,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
    });

    const result = await oauthService.getNewRefreshToken({
      connection: AuthConnection.Google,
      refreshToken: 'MOCK_REFRESH_TOKEN',
    });

    expect(result).toEqual({
      idTokens: ['MOCK_NEW_JWT_TOKEN'],
    });

    expect(fetch).toHaveBeenCalledWith(
      `${oauthConfig.authServerUrl}/api/v1/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          client_id: MOCK_GOOGLE_CLIENT_ID,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          login_provider: AuthConnection.Google,
          network: oauthConfig.web3AuthNetwork,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          refresh_token: 'MOCK_REFRESH_TOKEN',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          grant_type: 'refresh_token',
        }),
      },
    );
  });

  it('should throw an error if the get refresh token api call fails', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() => {
        return Promise.resolve({
          status: 401,
          ok: false,
          headers: new Headers({
            'content-type': 'application/json',
          }),
          json: jest.fn().mockResolvedValue({
            error: 'Unauthorized',
          }),
        });
      }) as jest.Mock,
    );

    const messenger = getMessenger();

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
      platform: mockPlatform,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
    });

    await expect(
      oauthService.getNewRefreshToken({
        connection: AuthConnection.Google,
        refreshToken: 'MOCK_REFRESH_TOKEN',
      }),
    ).rejects.toThrow(
      OAuthErrorMessages.FAILED_TO_GET_AUTH_TOKEN_REFRESH_ERROR,
    );
  });

  describe('OAuthService:getNewRefreshToken action', () => {
    it('gets a new refresh token', async () => {
      jest.spyOn(global, 'fetch').mockImplementation(
        jest.fn(() => {
          return Promise.resolve({
            json: jest.fn().mockResolvedValue({
              /* eslint-disable @typescript-eslint/naming-convention */
              id_token: 'MOCK_NEW_JWT_TOKEN',
              refresh_token: 'MOCK_NEW_REFRESH_TOKEN',
              revoke_token: 'MOCK_NEW_REVOKE_TOKEN',
              /* eslint-enable @typescript-eslint/naming-convention */
            }),
            status: 200,
            ok: true,
          });
        }) as jest.Mock,
      );

      const messenger = getMessenger();

      const oauthEnv = getOAuthLoginEnvs();

      // eslint-disable-next-line no-new
      new OAuthService({
        messenger,
        env: oauthEnv,
        webAuthenticator: mockWebAuthenticator,
        platform: mockPlatform,
        bufferedTrace: mockBufferedTrace,
        bufferedEndTrace: mockBufferedEndTrace,
        trackEvent: mockTrackEvent,
        addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
        getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
      });

      const result = await messenger.call('OAuthService:getNewRefreshToken', {
        connection: AuthConnection.Google,
        refreshToken: 'MOCK_REFRESH_TOKEN',
      });

      expect(result).toEqual({
        idTokens: ['MOCK_NEW_JWT_TOKEN'],
      });
    });
  });
});

describe('OAuthService - renewRefreshToken', () => {
  it('should be able to get new refresh token', async () => {
    // mock the fetch call to auth-server
    jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() => {
        return Promise.resolve({
          json: jest.fn().mockResolvedValue({
            success: true,
            message: 'Token revoked successfully',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            refresh_token: 'MOCK_NEW_REFRESH_TOKEN',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            revoke_token: 'MOCK_NEW_REVOKE_TOKEN',
          }),
          status: 201,
          ok: true,
        });
      }) as jest.Mock,
    );

    const messenger = getMessenger();

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
      platform: mockPlatform,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
    });
    const oauthConfig = loadOAuthConfig();

    const result = await oauthService.renewRefreshToken({
      connection: AuthConnection.Google,
      revokeToken: 'MOCK_REVOKE_TOKEN',
    });

    expect(result).toEqual({
      newRefreshToken: 'MOCK_NEW_REFRESH_TOKEN',
      newRevokeToken: 'MOCK_NEW_REVOKE_TOKEN',
    });

    expect(fetch).toHaveBeenCalledWith(
      `${oauthConfig.authServerUrl}/api/v2/oauth/renew_refresh_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          revoke_token: 'MOCK_REVOKE_TOKEN',
        }),
      },
    );
  });

  it('should throw an error if the renew refresh token api call fails', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() => {
        return Promise.resolve({
          status: 401,
          ok: false,
          headers: new Headers({
            'content-type': 'application/json',
          }),
          json: jest.fn().mockResolvedValue({
            error: 'Unauthorized',
          }),
        });
      }) as jest.Mock,
    );

    const messenger = getMessenger();

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
      platform: mockPlatform,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
    });

    await expect(
      oauthService.renewRefreshToken({
        connection: AuthConnection.Google,
        revokeToken: 'MOCK_REVOKE_TOKEN',
      }),
    ).rejects.toThrow(OAuthErrorMessages.FAILED_TO_RENEW_REFRESH_TOKEN);
  });
});

describe('OAuthService - revokeRefreshToken', () => {
  it('should be able to revoke refresh token', async () => {
    // mock the fetch call to auth-server
    jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() => {
        return Promise.resolve({
          json: jest.fn().mockResolvedValue({
            success: true,
            message: 'Token revoked successfully',
          }),
          status: 200,
          ok: true,
        });
      }) as jest.Mock,
    );

    const messenger = getMessenger();

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
      platform: mockPlatform,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
    });
    const oauthConfig = loadOAuthConfig();

    await oauthService.revokeRefreshToken({
      connection: AuthConnection.Google,
      revokeToken: 'MOCK_REVOKE_TOKEN',
    });

    expect(fetch).toHaveBeenCalledWith(
      `${oauthConfig.authServerUrl}/api/v2/oauth/revoke`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          revoke_token: 'MOCK_REVOKE_TOKEN',
        }),
      },
    );
  });

  it('should throw an error if the revoke refresh token api call fails', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() => {
        return Promise.resolve({
          status: 401,
          ok: false,
          headers: new Headers({
            'content-type': 'application/json',
          }),
          json: jest.fn().mockResolvedValue({
            error: 'Unauthorized',
          }),
        });
      }) as jest.Mock,
    );

    const messenger = getMessenger();

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
      platform: mockPlatform,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
      trackEvent: mockTrackEvent,
      addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
      getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
    });

    await expect(
      oauthService.revokeRefreshToken({
        connection: AuthConnection.Google,
        revokeToken: 'MOCK_REVOKE_TOKEN',
      }),
    ).rejects.toThrow(OAuthErrorMessages.FAILED_TO_REVOKE_TOKEN);
  });

  describe('OAuthService:renewRefreshToken action', () => {
    it('should be able to get new refresh token', async () => {
      // mock the fetch call to auth-server
      jest.spyOn(global, 'fetch').mockImplementation(
        jest.fn(() => {
          return Promise.resolve({
            json: jest.fn().mockResolvedValue({
              success: true,
              message: 'Token revoked successfully',
              /* eslint-disable @typescript-eslint/naming-convention */
              refresh_token: 'MOCK_NEW_REFRESH_TOKEN',
              revoke_token: 'MOCK_NEW_REVOKE_TOKEN',
              /* eslint-enable @typescript-eslint/naming-convention */
            }),
            status: 201,
            ok: true,
          });
        }) as jest.Mock,
      );

      const messenger = getMessenger();

      // eslint-disable-next-line no-new
      new OAuthService({
        messenger,
        env: getOAuthLoginEnvs(),
        webAuthenticator: mockWebAuthenticator,
        platform: mockPlatform,
        bufferedTrace: mockBufferedTrace,
        bufferedEndTrace: mockBufferedEndTrace,
        trackEvent: mockTrackEvent,
        addEventBeforeMetricsOptIn: mockAddEventBeforeMetricsOptIn,
        getParticipateInMetaMetrics: mockGetParticipateInMetaMetrics,
      });

      const result = await messenger.call('OAuthService:renewRefreshToken', {
        connection: AuthConnection.Google,
        revokeToken: 'MOCK_REVOKE_TOKEN',
      });

      expect(result).toEqual({
        newRefreshToken: 'MOCK_NEW_REFRESH_TOKEN',
        newRevokeToken: 'MOCK_NEW_REVOKE_TOKEN',
      });
    });
  });
});
