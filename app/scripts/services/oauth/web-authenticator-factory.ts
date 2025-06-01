import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { getPlatform } from '../../lib/util';
import { WebAuthenticator } from './types';
import { base64urlencode } from './utils';

async function generateCodeVerifierAndChallenge(): Promise<{
  codeVerifier: string;
  challenge: string;
}> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const codeVerifier = Array.from(bytes).join('');

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

export function webAuthenticatorFactory(): WebAuthenticator {
  const isFirefox = getPlatform() === PLATFORM_FIREFOX;
  const identityAPI = isFirefox
    ? globalThis.browser.identity // use browser.identity for Firefox
    : chrome.identity; // use chrome.identity for Chromium based browsers

  return {
    launchWebAuthFlow: identityAPI.launchWebAuthFlow,
    generateCodeVerifierAndChallenge,
    generateNonce,
    getRedirectURL: identityAPI.getRedirectURL,
  };
}
