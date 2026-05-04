import {
  Env as ProfileSyncEnv,
  Platform,
  getEnvUrls,
  getOidcClientId,
} from '@metamask/profile-sync-controller/sdk';
import { loadAuthenticationConfig } from 'shared/lib/authentication';

export async function exchangeJwtBearerForOidcAccessToken(
  jwtToken: string,
): Promise<string> {
  const profileSyncEnv = loadAuthenticationConfig();
  const oidcTokenUrl = `${getEnvUrls(profileSyncEnv).oidcApiUrl}/oauth2/token`;

  const body = new URLSearchParams();
  body.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  body.set('client_id', getOidcClientId(profileSyncEnv, Platform.EXTENSION));
  body.set('assertion', jwtToken);

  const response = await fetch(oidcTokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(
      `OIDC exchange failed: ${response.status} ${response.statusText}`,
    );
  }

  const responseData = await response.json();
  return responseData.access_token;
}
