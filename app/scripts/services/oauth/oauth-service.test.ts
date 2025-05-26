import {
  AuthConnection,
  Web3AuthNetwork,
} from '@metamask/seedless-onboarding-controller';
import { OAuthLoginEnv, WebAuthenticator } from './types';
import OAuthService from './oauth-service';
import { createLoginHandler } from './create-login-handler';

const DEFAULT_GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const DEFAULT_APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID as string;
const OAUTH_AUD = 'metamask';
const MOCK_USER_ID = 'user-id';
const MOCK_JWT_TOKEN =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN3bmFtOTA5QGdtYWlsLmNvbSIsInN1YiI6InN3bmFtOTA5QGdtYWlsLmNvbSIsImlzcyI6Im1ldGFtYXNrIiwiYXVkIjoibWV0YW1hc2siLCJpYXQiOjE3NDUyMDc1NjYsImVhdCI6MTc0NTIwNzg2NiwiZXhwIjoxNzQ1MjA3ODY2fQ.nXRRLB7fglRll7tMzFFCU0u7Pu6EddqEYf_DMyRgOENQ6tJ8OLtVknNf83_5a67kl_YKHFO-0PEjvJviPID6xg';

function getOAuthLoginEnvs(): OAuthLoginEnv {
  return {
    googleClientId: DEFAULT_GOOGLE_CLIENT_ID,
    appleClientId: DEFAULT_APPLE_CLIENT_ID,
    authServerUrl: process.env.AUTH_SERVER_URL as string,
    web3AuthNetwork: process.env.WEB3AUTH_NETWORK as Web3AuthNetwork,
    authConnectionId: process.env.AUTH_CONNECTION_ID as string,
    groupedAuthConnectionId: process.env.GROUPED_AUTH_CONNECTION_ID as string,
  };
}

const getRedirectUrlSpy = jest
  .fn()
    .mockReturnValue('https://mocked-redirect-uri');
const launchWebAuthFlowSpy = jest
  .fn()
    .mockResolvedValue('https://mocked-redirect-uri?code=mocked-code');

const mockWebAuthenticator: WebAuthenticator = {
  getRedirectURL: getRedirectUrlSpy,
  launchWebAuthFlow: launchWebAuthFlowSpy,
};

describe('OAuthService', () => {
  beforeEach(() => {
    // mock the fetch call to auth-server
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        verifier_id: MOCK_USER_ID,
        jwt_tokens: {
          [OAUTH_AUD]: MOCK_JWT_TOKEN,
        },
      }),
    });
    // mock the Math.random to return a fixed value nonce
    jest.spyOn(global.Math, 'random').mockReturnValue(0.1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should start the OAuth login process with `Google`', async () => {
    const oauthService = new OAuthService({
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
    });

    await oauthService.startOAuthLogin(AuthConnection.Google);

    const googleLoginHandler = createLoginHandler(
      AuthConnection.Google,
      mockWebAuthenticator.getRedirectURL(),
      getOAuthLoginEnvs(),
    );

    expect(launchWebAuthFlowSpy).toHaveBeenCalledWith({
      interactive: true,
      url: googleLoginHandler.getAuthUrl(),
    });
  });

  it('should start the OAuth login process with `Apple`', async () => {
    const oauthService = new OAuthService({
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
    });

    await oauthService.startOAuthLogin(AuthConnection.Apple);

    const appleLoginHandler = createLoginHandler(
      AuthConnection.Apple,
      mockWebAuthenticator.getRedirectURL(),
      getOAuthLoginEnvs(),
    );

    expect(launchWebAuthFlowSpy).toHaveBeenCalledWith({
      interactive: true,
      url: appleLoginHandler.getAuthUrl(),
    });
  });
});
