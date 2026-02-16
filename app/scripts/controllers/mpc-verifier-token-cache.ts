/**
 * In-memory cache for MPC verifier tokens.
 *
 * The UI pre-fetches a passkey assertion (WebAuthn signature) and stores it
 * here before triggering an MPC keyring operation.  The `getVerifierToken`
 * callback wired into the MPCKeyring reads from this cache.
 *
 * Tokens are single-use: they are deleted after the first read.
 */

const tokenCache = new Map<string, string>();

/**
 * Store a verifier token so the next `getVerifierToken(verifierId)` call
 * inside the MPC keyring can return it.
 *
 * @param verifierId - The verifier identifier (passkey public key).
 * @param token - The serialised passkey assertion JSON.
 */
export function cacheVerifierToken(
  verifierId: string,
  token: string,
): void {
  tokenCache.set(verifierId, token);
}

/**
 * Retrieve (and consume) a previously cached verifier token.
 *
 * @param verifierId - The verifier identifier.
 * @returns The cached token, or `undefined` if none was cached.
 */
export function consumeVerifierToken(
  verifierId: string,
): string | undefined {
  const token = tokenCache.get(verifierId);
  if (token !== undefined) {
    tokenCache.delete(verifierId);
  }
  return token;
}
