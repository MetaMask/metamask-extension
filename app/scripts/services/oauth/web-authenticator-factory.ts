import browser from 'webextension-polyfill';
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

async function requestIdentityPermission(): Promise<boolean> {
  const isFirefox = getPlatform() === PLATFORM_FIREFOX;
  if (isFirefox) {
    // in Firefox, 'identity' permission is not supported with the runtime permission request.
    // so we have to set 'identity' permission as required permission, in the firefox manifest.json file
    // since, the 'identity' was requested as installation permission, we don't need to re-request it here.
    // However, we still need to check if the permission is granted, coz the existing extension users might not have the permission.
    const grantedPermissions = browser.permissions;
    console.log('grantedPermissions', grantedPermissions);
    return grantedPermissions.contains({ permissions: ['identity'] });
  }

  // for other browsers, we can request the permission at runtime
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
