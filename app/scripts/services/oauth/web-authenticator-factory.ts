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

function getIdentityAPI(): typeof chrome.identity | typeof browser.identity {
  const isFirefox = getPlatform() === PLATFORM_FIREFOX;
  return isFirefox
    ? globalThis.browser.identity // use browser.identity for Firefox
    : chrome.identity; // use chrome.identity for Chromium based browsers
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

async function requestIdentityPermission(): Promise<boolean> {
  const isFirefox = getPlatform() === PLATFORM_FIREFOX;
  if (isFirefox) {
    // in Firefox (MV2), 'identity' permission is not supported with the runtime permission request.
    // so we have to set 'identity' permission as required permission, in the manifest.json file
    return true;
  }

  const permissionGranted = await chrome.permissions.request({
    permissions: ['identity'],
  });
  return permissionGranted;
}

export function webAuthenticatorFactory(): WebAuthenticator {
  return {
    launchWebAuthFlow,
    generateCodeVerifierAndChallenge,
    generateNonce,
    getRedirectURL,
    requestIdentityPermission,
  };
}
