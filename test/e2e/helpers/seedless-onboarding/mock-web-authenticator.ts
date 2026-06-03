import browser from 'webextension-polyfill';

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
  const redirectUrl = browser.runtime.getURL('home.html');

  return {
    generateNonce: () => nonce,
    launchWebAuthFlow: (
      _options: Record<string, unknown>,
      callback?: (url: string) => void,
    ) => {
      return Promise.resolve(
        callback?.(`${redirectUrl}?nonce=${nonce}&state=${state}&code=mock-code`),
      );
    },
    generateCodeVerifierAndChallenge: () =>
      Promise.resolve({
        codeVerifier: 'mock-code-verifier',
        challenge: 'mock-challenge',
      }),
    getRedirectURL: () => redirectUrl,
  };
}
