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
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const cryptoSource = globalThis.crypto;
  if (!cryptoSource?.getRandomValues) {
    throw new Error(
      'makeRegistrationToken: crypto.getRandomValues is not available; ' +
        'registration tokens require a CSPRNG source.',
    );
  }
  const bytes = new Uint8Array(16);
  cryptoSource.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
