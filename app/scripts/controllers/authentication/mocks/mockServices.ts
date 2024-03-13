import nock from 'nock';
import {
  AUTH_LOGIN_ENDPOINT,
  AUTH_NONCE_ENDPOINT,
  LoginResponse,
  NonceResponse,
  OAuthTokenResponse,
  OIDC_TOKENS_ENDPOINT,
} from '../services';

type MockReply = {
  status: nock.StatusCode;
  body?: nock.Body;
};

export const MOCK_NONCE = '4cbfqzoQpcNxVImGv';
const MOCK_NONCE_RESPONSE: NonceResponse = {
  nonce: MOCK_NONCE,
};
export function mockEndpointGetNonce(mockReply?: MockReply) {
  const reply = mockReply ?? { status: 200, body: MOCK_NONCE_RESPONSE };
  const mockNonceEndpoint = nock(AUTH_NONCE_ENDPOINT)
    .get('')
    .query(true)
    .reply(reply.status, reply.body);

  return mockNonceEndpoint;
}

export const MOCK_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
export const MOCK_LOGIN_RESPONSE: LoginResponse = {
  token: MOCK_JWT,
  expires_in: new Date().toString(),
  profile: {
    identifier_id: 'MOCK_IDENTIFIER',
    profile_id: 'MOCK_PROFILE_ID',
    metametrics_id: 'MOCK_METAMETRICS_ID',
  },
};
export function mockEndpointLogin(mockReply?: MockReply) {
  const reply = mockReply ?? { status: 200, body: MOCK_LOGIN_RESPONSE };
  const mockLoginEndpoint = nock(AUTH_LOGIN_ENDPOINT)
    .post('')
    .reply(reply.status, reply.body);

  return mockLoginEndpoint;
}

export const MOCK_ACCESS_TOKEN = `MOCK_ACCESS_TOKEN-${MOCK_JWT}`;
const MOCK_OATH_TOKEN_RESPONSE: OAuthTokenResponse = {
  access_token: MOCK_ACCESS_TOKEN,
  expires_in: new Date().getTime(),
};
export function mockEndpointAccessToken(mockReply?: MockReply) {
  const reply = mockReply ?? { status: 200, body: MOCK_OATH_TOKEN_RESPONSE };
  const mockOidcTokensEndpoint = nock(OIDC_TOKENS_ENDPOINT)
    .post('')
    .reply(reply.status, reply.body);

  return mockOidcTokensEndpoint;
}
