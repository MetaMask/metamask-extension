import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { Messenger } from '@metamask/base-controller';
import { OAuthErrorMessages } from '../../../../shared/modules/error';
import { ENVIRONMENT } from '../../../../development/build/constants';
import { OAuthServiceAction, WebAuthenticator } from './types';
import OAuthService from './oauth-service';
import { createLoginHandler } from './create-login-handler';
import { loadOAuthConfig } from './config';

const DEFAULT_GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const DEFAULT_APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID as string;
const MOCK_USER_ID = 'user-id';
const MOCK_REDIRECT_URI = 'https://mocked-redirect-uri';
const MOCK_JWT_TOKEN =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN3bmFtOTA5QGdtYWlsLmNvbSIsInN1YiI6InN3bmFtOTA5QGdtYWlsLmNvbSIsImlzcyI6Im1ldGFtYXNrIiwiYXVkIjoibWV0YW1hc2siLCJpYXQiOjE3NDUyMDc1NjYsImVhdCI6MTc0NTIwNzg2NiwiZXhwIjoxNzQ1MjA3ODY2fQ.nXRRLB7fglRll7tMzFFCU0u7Pu6EddqEYf_DMyRgOENQ6tJ8OLtVknNf83_5a67kl_YKHFO-0PEjvJviPID6xg';
const MOCK_NONCE = 'mocked-nonce';
const MOCK_STATE = JSON.stringify({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line camelcase, @typescript-eslint/naming-convention
  client_redirect_back_uri: MOCK_REDIRECT_URI,
  nonce: MOCK_NONCE,
});

function getOAuthLoginEnvs(): {
  googleClientId: string;
  appleClientId: string;
} {
  return {
    googleClientId: DEFAULT_GOOGLE_CLIENT_ID,
    appleClientId: DEFAULT_APPLE_CLIENT_ID,
  };
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

describe('OAuthService - startOAuthLogin', () => {
  beforeAll(() => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;
  });

  beforeEach(() => {
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
    jest.clearAllMocks();
  });

  it('should start the OAuth login process with `Google`', async () => {
    const rootMessenger = new Messenger();
    const messenger = rootMessenger.getRestricted<'OAuthService', never, never>(
      {
        name: 'OAuthService',
        allowedActions: [],
        allowedEvents: [],
      },
    );

    const oauthEnv = getOAuthLoginEnvs();

    const oauthService = new OAuthService({
      messenger,
      env: oauthEnv,
      webAuthenticator: mockWebAuthenticator,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
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
    const rootMessenger = new Messenger();
    const messenger = rootMessenger.getRestricted<'OAuthService', never, never>(
      {
        name: 'OAuthService',
        allowedActions: [],
        allowedEvents: [],
      },
    );

    const oauthEnv = getOAuthLoginEnvs();

    const oauthService = new OAuthService({
      messenger,
      env: oauthEnv,
      webAuthenticator: mockWebAuthenticator,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
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

  it('should throw an error if the state validation fails - google', async () => {
    const rootMessenger = new Messenger();
    const messenger = rootMessenger.getRestricted<'OAuthService', never, never>(
      {
        name: 'OAuthService',
        allowedActions: [],
        allowedEvents: [],
      },
    );

    const oauthEnv = getOAuthLoginEnvs();

    const oauthService = new OAuthService({
      messenger,
      env: oauthEnv,
      webAuthenticator: {
        ...mockWebAuthenticator,
        generateNonce: jest.fn().mockReturnValue(Math.random().toString()),
      },
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
    });

    await expect(
      oauthService.startOAuthLogin(AuthConnection.Google),
    ).rejects.toThrow(OAuthErrorMessages.INVALID_OAUTH_STATE_ERROR);
  });

  describe('OAuthService:startOAuthLogin action', () => {
    it('starts the OAuth login process with `Google`', async () => {
      const rootMessenger = new Messenger<OAuthServiceAction, never>();
      const messenger = rootMessenger.getRestricted<
        'OAuthService',
        never,
        never
      >({
        name: 'OAuthService',
        allowedActions: [],
        allowedEvents: [],
      });

      const oauthEnv = getOAuthLoginEnvs();

      // eslint-disable-next-line no-new
      new OAuthService({
        messenger,
        env: oauthEnv,
        webAuthenticator: mockWebAuthenticator,
        bufferedTrace: mockBufferedTrace,
        bufferedEndTrace: mockBufferedEndTrace,
      });

      await rootMessenger.call(
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

    const rootMessenger = new Messenger();
    const messenger = rootMessenger.getRestricted<'OAuthService', never, never>(
      {
        name: 'OAuthService',
        allowedActions: [],
        allowedEvents: [],
      },
    );

    const oauthConfig = loadOAuthConfig();

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
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
          client_id: DEFAULT_GOOGLE_CLIENT_ID,
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
        });
      }) as jest.Mock,
    );

    const rootMessenger = new Messenger();
    const messenger = rootMessenger.getRestricted<'OAuthService', never, never>(
      {
        name: 'OAuthService',
        allowedActions: [],
        allowedEvents: [],
      },
    );

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
    });

    await expect(
      oauthService.getNewRefreshToken({
        connection: AuthConnection.Google,
        refreshToken: 'MOCK_REFRESH_TOKEN',
      }),
    ).rejects.toThrow('Failed to get auth token');
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

      const rootMessenger = new Messenger<OAuthServiceAction, never>();
      const messenger = rootMessenger.getRestricted<
        'OAuthService',
        never,
        never
      >({
        name: 'OAuthService',
        allowedActions: [],
        allowedEvents: [],
      });

      const oauthEnv = getOAuthLoginEnvs();

      // eslint-disable-next-line no-new
      new OAuthService({
        messenger,
        env: oauthEnv,
        webAuthenticator: mockWebAuthenticator,
        bufferedTrace: mockBufferedTrace,
        bufferedEndTrace: mockBufferedEndTrace,
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

    const rootMessenger = new Messenger();
    const messenger = rootMessenger.getRestricted<'OAuthService', never, never>(
      {
        name: 'OAuthService',
        allowedActions: [],
        allowedEvents: [],
      },
    );

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
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
        });
      }) as jest.Mock,
    );

    const rootMessenger = new Messenger();
    const messenger = rootMessenger.getRestricted<'OAuthService', never, never>(
      {
        name: 'OAuthService',
        allowedActions: [],
        allowedEvents: [],
      },
    );

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
    });

    await expect(
      oauthService.renewRefreshToken({
        connection: AuthConnection.Google,
        revokeToken: 'MOCK_REVOKE_TOKEN',
      }),
    ).rejects.toThrow('Failed to renew refresh token');
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

    const rootMessenger = new Messenger();
    const messenger = rootMessenger.getRestricted<'OAuthService', never, never>(
      {
        name: 'OAuthService',
        allowedActions: [],
        allowedEvents: [],
      },
    );

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
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
        });
      }) as jest.Mock,
    );

    const rootMessenger = new Messenger();
    const messenger = rootMessenger.getRestricted<'OAuthService', never, never>(
      {
        name: 'OAuthService',
        allowedActions: [],
        allowedEvents: [],
      },
    );

    const oauthService = new OAuthService({
      messenger,
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
      bufferedTrace: mockBufferedTrace,
      bufferedEndTrace: mockBufferedEndTrace,
    });

    await expect(
      oauthService.revokeRefreshToken({
        connection: AuthConnection.Google,
        revokeToken: 'MOCK_REVOKE_TOKEN',
      }),
    ).rejects.toThrow('Failed to revoke refresh token');
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

      const rootMessenger = new Messenger<OAuthServiceAction, never>();
      const messenger = rootMessenger.getRestricted<
        'OAuthService',
        never,
        never
      >({
        name: 'OAuthService',
        allowedActions: [],
        allowedEvents: [],
      });

      // eslint-disable-next-line no-new
      new OAuthService({
        messenger,
        env: getOAuthLoginEnvs(),
        webAuthenticator: mockWebAuthenticator,
        bufferedTrace: mockBufferedTrace,
        bufferedEndTrace: mockBufferedEndTrace,
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
