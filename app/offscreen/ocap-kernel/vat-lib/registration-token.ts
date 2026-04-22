/**
 * Generate an opaque cryptographic-random token for service registration.
 *
 * SES lockdown blocks `Math.random()` inside vats, so this uses the Web
 * Crypto API (available in the iframe vat-worker context used by the
 * extension). Throws if no crypto source is reachable, since an
 * unpredictable token is required: if the matcher could be tricked into
 * registering a service under a weak token, third parties could spoof
 * registrations for services they don't control.
 *
 * @returns A 128-bit hex-encoded random token.
 */
export function makeRegistrationToken(): string {
  // Try `crypto` as a bare global (what endowments land as, as Compartment
  // properties) before `globalThis.crypto`, to minimize the chance that
  // the compartment's globalThis hasn't plumbed the endowment through.
  const bareCrypto: unknown =
    typeof crypto === 'undefined' ? undefined : crypto;
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const cryptoSource = (bareCrypto ?? globalThis.crypto) as
    | { getRandomValues?: (array: Uint8Array) => Uint8Array }
    | undefined;
  if (!cryptoSource?.getRandomValues) {
    throw new Error(
      'makeRegistrationToken: crypto.getRandomValues is not available; ' +
        `typeof crypto=${typeof crypto}, ` +
        `typeof globalThis.crypto=${typeof (globalThis as { crypto?: unknown }).crypto}`,
    );
  }
  const bytes = new Uint8Array(16);
  cryptoSource.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
