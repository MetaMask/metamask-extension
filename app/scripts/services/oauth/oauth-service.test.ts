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
const MOCK_REDIRECT_URI = 'https://mocked-redirect-uri';
const MOCK_JWT_TOKEN =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN3bmFtOTA5QGdtYWlsLmNvbSIsInN1YiI6InN3bmFtOTA5QGdtYWlsLmNvbSIsImlzcyI6Im1ldGFtYXNrIiwiYXVkIjoibWV0YW1hc2siLCJpYXQiOjE3NDUyMDc1NjYsImVhdCI6MTc0NTIwNzg2NiwiZXhwIjoxNzQ1MjA3ODY2fQ.nXRRLB7fglRll7tMzFFCU0u7Pu6EddqEYf_DMyRgOENQ6tJ8OLtVknNf83_5a67kl_YKHFO-0PEjvJviPID6xg';
const MOCK_NONCE = 'mocked-nonce';
const MOCK_STATE = JSON.stringify({
  // eslint-disable-next-line camelcase
  client_redirect_back_uri: MOCK_REDIRECT_URI,
  nonce: MOCK_NONCE,
});

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

describe('OAuthService', () => {
  beforeEach(() => {
    // mock the fetch call to auth-server
    jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() => {
        return Promise.resolve({
          json: jest.fn().mockResolvedValue({
            verifier_id: MOCK_USER_ID,
            jwt_tokens: {
              [OAUTH_AUD]: MOCK_JWT_TOKEN,
            },
          }),
        });
      }) as jest.Mock,
    );
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
    const oauthService = new OAuthService({
      env: getOAuthLoginEnvs(),
      webAuthenticator: mockWebAuthenticator,
    });

    await oauthService.startOAuthLogin(AuthConnection.Apple);

    const appleLoginHandler = createLoginHandler(
      AuthConnection.Apple,
      mockWebAuthenticator.getRedirectURL(),
      getOAuthLoginEnvs(),
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
});
