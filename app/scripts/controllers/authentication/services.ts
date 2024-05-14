const AUTH_ENDPOINT = process.env.AUTH_API || '';
export const AUTH_NONCE_ENDPOINT = `${AUTH_ENDPOINT}/api/v2/nonce`;
export const AUTH_LOGIN_ENDPOINT = `${AUTH_ENDPOINT}/api/v2/srp/login`;

const OIDC_ENDPOINT = process.env.OIDC_API || '';
export const OIDC_TOKENS_ENDPOINT = `${OIDC_ENDPOINT}/oauth2/token`;
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || '';
const OIDC_GRANT_TYPE = process.env.OIDC_GRANT_TYPE || '';

export type NonceResponse = {
  nonce: string;
};
export async function getNonce(publicKey: string): Promise<string | null> {
  const nonceUrl = new URL(AUTH_NONCE_ENDPOINT);
  nonceUrl.searchParams.set('identifier', publicKey);

  try {
    const nonceResponse = await fetch(nonceUrl.toString());
    if (!nonceResponse.ok) {
      return null;
    }

    const nonceJson: NonceResponse = await nonceResponse.json();
    return nonceJson?.nonce ?? null;
  } catch (e) {
    console.error('authentication-controller/services: unable to get nonce', e);
    return null;
  }
}

export type LoginResponse = {
  token: string;
  expires_in: string;
  /**
   * Contains anonymous information about the logged in profile.
   *
   * @property identifier_id - a deterministic unique identifier on the method used to sign in
   * @property profile_id - a unique id for a given profile
   * @property metametrics_id - an anonymous server id
   */
  profile: {
    identifier_id: string;
    profile_id: string;
    metametrics_id: string;
  };
};
export async function login(
  rawMessage: string,
  signature: string,
): Promise<LoginResponse | null> {
  try {
    const response = await fetch(AUTH_LOGIN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signature,
        raw_message: rawMessage,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const loginResponse: LoginResponse = await response.json();
    return loginResponse ?? null;
  } catch (e) {
    console.error('authentication-controller/services: unable to login', e);
    return null;
  }
}

export type OAuthTokenResponse = {
  access_token: string;
  expires_in: number;
};
export async function getAccessToken(jwtToken: string): Promise<string | null> {
  const headers = new Headers({
    'Content-Type': 'application/x-www-form-urlencoded',
  });

  const urlEncodedBody = new URLSearchParams();
  urlEncodedBody.append('grant_type', OIDC_GRANT_TYPE);
  urlEncodedBody.append('client_id', OIDC_CLIENT_ID);
  urlEncodedBody.append('assertion', jwtToken);

  try {
    const response = await fetch(OIDC_TOKENS_ENDPOINT, {
      method: 'POST',
      headers,
      body: urlEncodedBody.toString(),
    });

    if (!response.ok) {
      return null;
    }

    const accessTokenResponse: OAuthTokenResponse = await response.json();
    return accessTokenResponse?.access_token ?? null;
  } catch (e) {
    console.error(
      'authentication-controller/services: unable to get access token',
      e,
    );
    return null;
  }
}

export function createLoginRawMessage(
  nonce: string,
  publicKey: string,
): `metamask:${string}:${string}` {
  return `metamask:${nonce}:${publicKey}` as const;
}
