import {
  Env,
  getEnvUrls,
  type LoginResponse,
} from '@metamask/profile-sync-controller/sdk';
import type { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';

function decodeJwtIss(accessToken: string): string | null {
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }
    const payload = parts[1];
    const normalized = payload.replaceAll('-', '+').replaceAll('_', '/');
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
  return decodeJwtIss(accessToken) === expectedOidcIss;
}

/**
 * Clears persisted Profile Sync sessions minted for a different OIDC env.
 * @param state
 * @param env
 */
export function sanitizePersistedAuthenticationState(
  state: AuthenticationControllerState | undefined,
  env: Env,
): AuthenticationControllerState | undefined {
  if (!state?.srpSessionData) {
    return state?.isSignedIn ? { ...state, isSignedIn: false } : state;
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
  return { ...state, isSignedIn: false, srpSessionData: undefined };
}
