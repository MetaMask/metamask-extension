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

export class MockSeedlessOnboardingUtils {
  readonly AUTH_SERVER_TOKEN_PATH =
    'https://api-develop-torus-byoa.web3auth.io/api/v1/oauth/token';

  readonly TOPRF_SERVICE_PATH_REGEX =
    /https:\/\/node-[1-5]\.dev-node\.web3auth\.io\/sss\/jrpc/u;

  mockAuthServerToken(_overrides?: {
    statusCode?: number;
    json?: Record<string, unknown>;
    userEmail?: string;
  }) {
    const jwtToken = generateMockJwtToken(
      _overrides?.userEmail || Math.random().toString(36).slice(2, 10),
    );
    return {
      statusCode: 200,
      json: {
        access_token: 'mock-access-token',
        jwt_tokens: {
          metamask: jwtToken,
        },
        expires_in: 3600,
      },
    };
  }

  mockToprfCommitment(nodeIndex: string) {
    return {
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        result: {
          signature: 'MOCK_NODE_SIGNATURE',
          data: 'MOCK_NODE_DATA',
          nodePubX: 'MOCK_NODE_PUB_X',
          nodePubY: 'MOCK_NODE_PUB_Y',
          nodeIndex,
        },
        id: 10,
      },
    };
  }

  mockToprfAuthenticate(nodeIndex: string) {
    console.log(
      'MockSeedlessOnboardingUtils::mockToprfAuthenticate:nodeIndex',
      nodeIndex,
    );
    return {
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        result: {
          authToken: 'MOCK_AUTH_TOKEN',
          nodeIndex,
          pubKey: 'MOCK_USER_PUB_KEY',
          keyIndex: 0,
          nodePubKey: 'MOCK_NODE_PUB_KEY',
        },
        id: 10,
      },
    };
  }

  // TODO: Fix this mock to support multiple nodes for TOPRF service
  async mockToprf(
    path: string,
    request: Pick<CompletedRequest, 'path' | 'body'>,
  ) {
    const requestBody = (await request.body.getJson()) as Record<
      string,
      unknown
    >;
    const nodeIndex = path.match(/node-[1-5]/u)?.[0].split('-')[1];
    if (!nodeIndex) {
      throw new Error('Node index not found in path');
    }

    const jrpcMethod = requestBody?.method;

    if (jrpcMethod === 'TOPRFAuthenticateRequest') {
      return this.mockToprfAuthenticate(nodeIndex);
    }

    return this.mockToprfCommitment(nodeIndex);
  }

  onPost(
    path: string,
    request: Pick<CompletedRequest, 'path' | 'body'>,
    overrides?: {
      statusCode?: number;
      userEmail?: string;
    },
  ) {
    if (path.match(this.TOPRF_SERVICE_PATH_REGEX)) {
      return this.mockToprf(path, request);
    }
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
      callback: (url: string) => void,
    ) => {
      return Promise.resolve(
        callback(
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
