import { CompletedRequest, Mockttp } from 'mockttp';

export class MockSeedlessOnboardingUtils {
  onPost(
    path: string,
    _request: Pick<CompletedRequest, 'path' | 'body'>,
    statusCode: number = 204,
  ) {
    // TODO: filter the paths and return relevant responses
    console.log('MockAuthServer::onPost', path);
    return {
      statusCode,
      json: {
        access_token: 'mock-access-token',
        jwt_tokens: {
          metamask:
            'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3R1c2VyQGdtYWlsLmNvbSIsImlhdCI6MTc0OTE3ODg5NSwiYXVkIjoibWV0YW1hc2siLCJpc3MiOiJtZXRhbWFzayIsInN1YiI6InRlc3R1c2VyQGdtYWlsLmNvbSJ9.bm9ZgrJHAOg-7GKgWpaZNw4M7ba9NVuuKVPk6hAOqpbC1OQNunTGA3gslzcSJfTj_g1HXf_d9yLNQkXw5D9Vag',
        },
        expires_in: 3600,
      },
    };
  }

  setup(path: string, server: Mockttp) {
    server
      .forPost(path)
      .always()
      .thenCallback((request) => this.onPost(path, request, 200));
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
