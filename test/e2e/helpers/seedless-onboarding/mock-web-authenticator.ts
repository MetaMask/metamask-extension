import browser from 'webextension-polyfill';
import { E2E_REDIRECT_URL } from './constants';

function getMockRedirectUrl(): string {
  if (typeof document !== 'undefined') {
    return E2E_REDIRECT_URL;
  }

  if (typeof browser.identity?.getRedirectURL === 'function') {
    return browser.identity.getRedirectURL();
  }

  if (typeof browser.runtime?.getURL === 'function') {
    return browser.runtime.getURL('home.html');
  }

  return 'chrome-extension://mock-extension-id/home.html';
}

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
  const redirectUrl = getMockRedirectUrl();
  const redirectUrlWithAuthData = new URL(redirectUrl);
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
    getRedirectURL: () => redirectUrl,
  };
}
