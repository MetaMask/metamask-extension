import {
  Env,
  getEnvUrls,
  type LoginResponse,
} from '@metamask/profile-sync-controller/sdk';
import type { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';

function decodeJwtIss(accessToken: string): string | null {
  try {
    const [, payload] = accessToken.split('.');
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/gu, '+').replace(/_/gu, '/');
    const json = JSON.parse(atob(normalized)) as { iss?: unknown };
    return typeof json.iss === 'string' ? json.iss : null;
  } catch {
    return null;
  }
}

function sessionMatchesEnv(
  session: LoginResponse | undefined,
  expectedOidcIss: string,
): boolean {
  const accessToken = session?.token?.accessToken;
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    return false;
  }
  const iss = decodeJwtIss(accessToken);
  return iss === expectedOidcIss;
}

/**
 * Drop persisted Profile Sync sessions minted for a different OIDC env.
 *
 * Restarting the app alone is not enough: `AuthenticationController` reuses
 * `srpSessionData` until expiry, so a DEV JWT keeps getting sent after switching
 * local config to PRD (and staging on-ramp then returns 401).
 */
export function sanitizePersistedAuthenticationState(
  state: AuthenticationControllerState | undefined,
  env: Env,
): AuthenticationControllerState | undefined {
  if (!state?.srpSessionData) {
    return state;
  }

  const expectedOidcIss = getEnvUrls(env).oidcApiUrl;
  const sessions = Object.values(state.srpSessionData);
  const allMatch =
    sessions.length > 0 &&
    sessions.every((session) => sessionMatchesEnv(session, expectedOidcIss));

  if (allMatch) {
    return state;
  }

  console.warn(
    `[authentication] Clearing persisted Profile Sync session(s) that were not minted for OIDC ${expectedOidcIss}. A fresh sign-in will mint a matching token.`,
  );

  return {
    ...state,
    isSignedIn: false,
    srpSessionData: undefined,
  };
}
