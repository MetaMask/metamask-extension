import browser from 'webextension-polyfill';
import { WebAuthenticator } from './types';
import { base64urlencode } from './utils';

async function generateCodeVerifierAndChallenge(): Promise<{
  codeVerifier: string;
  challenge: string;
}> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const codeVerifier = base64urlencode(bytes);

  const challengeBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier),
  );

  const challenge = base64urlencode(challengeBuffer);

  return {
    codeVerifier,
    challenge,
  };
}

function generateNonce(): string {
  return crypto.randomUUID();
}

function getIdentityAPI(): typeof chrome.identity | typeof browser.identity {
  // if chrome.identity API is available, we will use it
  // note that, in firefox, chrome.identity is available
  // but only some of the methods are supported
  // learn more here {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/identity#browser_compatibility}
  if (
    chrome?.identity &&
    'getRedirectURL' in chrome.identity &&
    'launchWebAuthFlow' in chrome.identity
  ) {
    return chrome.identity;
  }

  // otherwise use browser.identity API
  return browser.identity;
}

async function launchWebAuthFlow(
  options: {
    url: string;
    interactive?: boolean;
  },
  callback: (responseUrl?: string) => void,
) {
  const identityAPI = getIdentityAPI();
  return identityAPI.launchWebAuthFlow(options, callback);
}

function getRedirectURL(): string {
  const identityAPI = getIdentityAPI();
  return identityAPI.getRedirectURL();
}

export function webAuthenticatorFactory(): WebAuthenticator {
  if (process.env.IN_TEST) {
    const { mockWebAuthenticator } = require('../../../../test/e2e/helpers/seedless-onboarding/mock-web-authenticator');
    return mockWebAuthenticator();
  }

  return {
    launchWebAuthFlow,
    generateCodeVerifierAndChallenge,
    generateNonce,
    getRedirectURL,
  };
}
