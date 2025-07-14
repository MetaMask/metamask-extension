export const AuthServer = {
  // Request JWT Token from Auth Server in exchange for OAuth2 Authorization Code
  RequestToken: 'https://auth-service.dev-api.cx.metamask.io/api/v1/oauth/token',
  // Revoke current JWT Token from Auth Server
  RevokeToken: 'https://auth-service.dev-api.cx.metamask.io/api/v1/oauth/revoke',
};

export const SSS_BASE_URL_RGX = /https:\/\/node-[1-5]\.dev-node\.web3auth\.io\/sss\/jrpc/

export const METADATA_SET_PATH = 'https://node-1.dev-node.web3auth.io/metadata/enc_account_data/set';
