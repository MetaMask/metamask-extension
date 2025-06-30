import { sign } from 'jsonwebtoken';
import { CompletedRequest, Mockttp } from 'mockttp';

const MOCK_JWT_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMEECAQAwEwYHKoZIzj0CAQYIKoZIzj0DAQcEJzAlAgEBBCCD7oLrcKae+jVZPGx52Cb/lKhdKxpXjl9eGNa1MlY57A==\n-----END PRIVATE KEY-----`;

function generateMockJwtToken(userId: string) {
  const iat = Math.floor(Date.now() / 1000);
  const payload = {
    iss: 'torus-key-test',
    aud: 'torus-key-test',
    name: userId,
    email: userId,
    scope: 'email',
    iat,
    eat: iat + 120,
  };

  return sign(payload, MOCK_JWT_PRIVATE_KEY, {
    expiresIn: 120,
    algorithm: 'ES256',
  });
}

// Mock OAuth Service and Authentication Server
export class OAuthMockttpService {
  readonly AUTH_SERVER_TOKEN_PATH =
    'https://auth-service.dev-api.cx.metamask.io/api/v1/oauth/token';

  mockAuthServerToken(_overrides?: {
    statusCode?: number;
    json?: Record<string, unknown>;
    userEmail?: string;
  }) {
    const userEmail =
      _overrides?.userEmail || `e2e-user-${crypto.randomUUID()}`;
    const idToken = generateMockJwtToken(userEmail);
    return {
      statusCode: 200,
      json: {
        access_token: 'mock-access-token',
        id_token: idToken,
        expires_in: 3600,
      },
    };
  }

  onPost(
    _path: string,
    _request: Pick<CompletedRequest, 'path' | 'body'>,
    overrides?: {
      statusCode?: number;
      userEmail?: string;
    },
  ) {
    return this.mockAuthServerToken(overrides);
  }

  /**
   * Setup the mock server for OAuth Service. (Web Authentication flow + Auth server)
   *
   * @param server - The Mockttp server instance.
   * @param options - The options for the mock server.
   * @param options.userEmail - The email of the user to mock. If not provided, random generated email will be used.
   */
  async setup(
    server: Mockttp,
    options?: {
      userEmail?: string;
    },
  ) {
    server
      .forPost(this.AUTH_SERVER_TOKEN_PATH)
      .always()
      .thenCallback((request) => {
        return this.onPost(this.AUTH_SERVER_TOKEN_PATH, request, options);
      });
  }
}

export function mockWebAuthenticator() {
  const nonce = Math.random().toString(36).substring(2, 15);
  const state = JSON.stringify({
    nonce,
  });
  return {
    generateNonce: () => nonce,
    launchWebAuthFlow: (
      _options: Record<string, unknown>,
      callback?: (url: string) => void,
    ) => {
      return Promise.resolve(
        callback?.(
          `https://mock-redirect-url.com?nonce=${nonce}&state=${state}&code=mock-code`,
        ),
      );
    },
    generateCodeVerifierAndChallenge: () =>
      Promise.resolve({
        codeVerifier: 'mock-code-verifier',
        challenge: 'mock-challenge',
      }),
    getRedirectURL: () => 'https://mock-redirect-url.com',
  };
}
