import { getIdentityAPI } from '../../../../shared/lib/oauth';
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
    const { mockWebAuthenticator } =
      // Use `require` to make it easier to exclude this test code from the Browserify build.
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, node/global-require
      require('../../../../test/e2e/helpers/seedless-onboarding/mock-web-authenticator');
    return mockWebAuthenticator();
  }

  return {
    launchWebAuthFlow,
    generateCodeVerifierAndChallenge,
    generateNonce,
    getRedirectURL,
  };
}
