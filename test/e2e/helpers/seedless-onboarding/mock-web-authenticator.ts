export const MOCK_REDIRECT_URL = 'https://metamask.github.io/mock-redirect';

/**
 * Mock the WebAuthenticator object for the Seedless Onboarding flow e2e tests.
 *
 * @returns The mock WebAuthenticator object.
 */
export function mockWebAuthenticator() {
  const nonce = Math.random().toString(36).substring(2, 15);
  const state = JSON.stringify({
    nonce,
  });
  const redirectUrlWithAuthData = new URL(MOCK_REDIRECT_URL);
  redirectUrlWithAuthData.searchParams.set('nonce', nonce);
  redirectUrlWithAuthData.searchParams.set('state', state);
  redirectUrlWithAuthData.searchParams.set('code', 'mock-code');

  return {
    generateNonce: () => nonce,
    launchWebAuthFlow: (
      _options: Record<string, unknown>,
      callback?: (url: string) => void,
    ) => {
      return Promise.resolve(callback?.(redirectUrlWithAuthData.toString()));
    },
    generateCodeVerifierAndChallenge: () =>
      Promise.resolve({
        codeVerifier: 'mock-code-verifier',
        challenge: 'mock-challenge',
      }),
    getRedirectURL: () => MOCK_REDIRECT_URL,
  };
}
