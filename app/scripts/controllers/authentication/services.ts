const AUTH_ENDPOINT = process.env.AUTH_API || '';
export const AUTH_NONCE_ENDPOINT = `${AUTH_ENDPOINT}/api/v2/nonce`;
export const AUTH_LOGIN_ENDPOINT = `${AUTH_ENDPOINT}/api/v2/snaps/login`;

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

  const nonce = await fetch(nonceUrl.toString())
    .then((r) => {
      return r.ok ? r.json() : null;
    })
    .then((r: NonceResponse | null) => r?.nonce)
    .catch(() => null);

  return nonce ?? null;
}

export type LoginResponse = {
  token: string;
  expires_in: string;
  /**
   * Contains anonymous information about the logged in profile.
   *
   * @property identifier_id - a deterministic unique identifier on the method used to sign in
   * @property profile_id - a unique id for a given profile, available in a future task
   */
  profile: {
    identifier_id: string;
  };
};
export async function login(
  rawMessage: string,
  signature: string,
): Promise<LoginResponse | null> {
  const token = await fetch(AUTH_LOGIN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      signature,
      raw_message: rawMessage,
    }),
  })
    .then((r) => {
      return r.ok ? r.json() : null;
    })
    .then((r: LoginResponse | null) => r)
    .catch(() => null);

  return token;
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

  const accessToken = await fetch(OIDC_TOKENS_ENDPOINT, {
    method: 'POST',
    headers,
    body: urlEncodedBody.toString(),
  })
    .then((r) => {
      return r.ok ? r.json() : null;
    })
    .then((r: OAuthTokenResponse | null) => r?.access_token)
    .catch(() => null);

  return accessToken ?? null;
}

export function createLoginRawMessage(nonce: string, publicKey: string) {
  return `metamask:${nonce}:${publicKey}` as const;
}
