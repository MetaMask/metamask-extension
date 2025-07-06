import {
  AuthConnection,
  Web3AuthNetwork,
} from '@metamask/seedless-onboarding-controller';
import { OAuthErrorMessages } from '../../../../shared/modules/error';
import { ENVIRONMENT } from '../../../../development/build/constants';
import { OAuthConfig, WebAuthenticator } from './types';
import OAuthService from './oauth-service';
import { createLoginHandler } from './create-login-handler';
import { OAUTH_CONFIG } from './constants';

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

function getOAuthConfig(): OAuthConfig {
  const config = OAUTH_CONFIG.development;

  return {
    authServerUrl: config.AUTH_SERVER_URL,
    web3AuthNetwork: config.WEB3AUTH_NETWORK as Web3AuthNetwork,
    googleAuthConnectionId: config.GOOGLE_AUTH_CONNECTION_ID,
    googleGrouppedAuthConnectionId: config.GOOGLE_GROUPED_AUTH_CONNECTION_ID,
    appleAuthConnectionId: config.APPLE_AUTH_CONNECTION_ID,
    appleGrouppedAuthConnectionId: config.APPLE_GROUPED_AUTH_CONNECTION_ID,
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
        });
      }) as jest.Mock,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should start the OAuth login process with `Google`', async () => {
    const oauthEnv = getOAuthLoginEnvs();

    const oauthService = new OAuthService({
      env: oauthEnv,
      webAuthenticator: mockWebAuthenticator,
    });

    await oauthService.startOAuthLogin(AuthConnection.Google);

    const googleLoginHandler = createLoginHandler(
      AuthConnection.Google,
      {
        ...oauthEnv,
        ...getOAuthConfig(),
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
    const oauthEnv = getOAuthLoginEnvs();

    const oauthService = new OAuthService({
      env: oauthEnv,
      webAuthenticator: mockWebAuthenticator,
    });

    await oauthService.startOAuthLogin(AuthConnection.Apple);

    const appleLoginHandler = createLoginHandler(
      AuthConnection.Apple,
      {
        ...oauthEnv,
        ...getOAuthConfig(),
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
    const oauthEnv = getOAuthLoginEnvs();

    const oauthService = new OAuthService({
      env: oauthEnv,
      webAuthenticator: {
        ...mockWebAuthenticator,
        generateNonce: jest.fn().mockReturnValue(Math.random().toString()),
      },
    });

    await expect(
      oauthService.startOAuthLogin(AuthConnection.Google),
    ).rejects.toThrow(OAuthErrorMessages.INVALID_OAUTH_STATE_ERROR);
  });
});

describe('OAuthService - getNewRefreshToken', () => {
  beforeEach(() => {
    // mock the fetch call to auth-server
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
        });
      }) as jest.Mock,
    );
  });

  it('should be able to get new refresh token', async () => {
    const oauthConfig = getOAuthConfig();

    const oauthService = new OAuthService({
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
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
});

describe('OAuthService - revokeAndGetNewRefreshToken', () => {
  beforeEach(() => {
    // mock the fetch call to auth-server
    jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() => {
        return Promise.resolve({
          json: jest.fn().mockResolvedValue({
            success: true,
            message: 'Token revoked successfully',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            new_refresh_token: 'MOCK_NEW_REFRESH_TOKEN',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            new_revoke_token: 'MOCK_NEW_REVOKE_TOKEN',
          }),
        });
      }) as jest.Mock,
    );
  });

  it('should be able to get new refresh token', async () => {
    const oauthService = new OAuthService({
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
    });
    const oauthConfig = getOAuthConfig();

    const result = await oauthService.revokeAndGetNewRefreshToken({
      connection: AuthConnection.Google,
      revokeToken: 'MOCK_REVOKE_TOKEN',
    });

    expect(result).toEqual({
      newRefreshToken: 'MOCK_NEW_REFRESH_TOKEN',
      newRevokeToken: 'MOCK_NEW_REVOKE_TOKEN',
    });

    expect(fetch).toHaveBeenCalledWith(
      `${oauthConfig.authServerUrl}/api/v1/oauth/revoke`,
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
});
