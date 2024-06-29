import {
  AUTH_LOGIN_ENDPOINT,
  AUTH_NONCE_ENDPOINT,
  LoginResponse,
  NonceResponse,
  OAuthTokenResponse,
  OIDC_TOKENS_ENDPOINT,
} from '../services';

type MockResponse = {
  url: string;
  requestMethod: 'GET' | 'POST' | 'PUT';
  response: unknown;
};

export const MOCK_NONCE = '4cbfqzoQpcNxVImGv';
export const MOCK_NONCE_RESPONSE: NonceResponse = {
  nonce: MOCK_NONCE,
};

export function getMockAuthNonceResponse() {
  return {
    url: AUTH_NONCE_ENDPOINT,
    requestMethod: 'GET',
    response: MOCK_NONCE_RESPONSE,
  } satisfies MockResponse;
}

export const MOCK_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
export const MOCK_LOGIN_RESPONSE: LoginResponse = {
  token: MOCK_JWT,
  expires_in: new Date().toString(),
  profile: {
    identifier_id: 'MOCK_IDENTIFIER',
    profile_id: 'MOCK_PROFILE_ID',
  },
};

export function getMockAuthLoginResponse() {
  return {
    url: AUTH_LOGIN_ENDPOINT,
    requestMethod: 'POST',
    response: MOCK_LOGIN_RESPONSE,
  } satisfies MockResponse;
}

export const MOCK_ACCESS_TOKEN = `MOCK_ACCESS_TOKEN-${MOCK_JWT}`;
export const MOCK_OATH_TOKEN_RESPONSE: OAuthTokenResponse = {
  access_token: MOCK_ACCESS_TOKEN,
  expires_in: new Date().getTime(),
};

export function getMockAuthAccessTokenResponse() {
  return {
    url: OIDC_TOKENS_ENDPOINT,
    requestMethod: 'POST',
    response: MOCK_OATH_TOKEN_RESPONSE,
  } satisfies MockResponse;
}
