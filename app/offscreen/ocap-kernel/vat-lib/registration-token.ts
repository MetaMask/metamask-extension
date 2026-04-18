/**
 * Generate an opaque random token for service registration.
 *
 * Uses non-cryptographic randomness; acceptable for a prototype, replace
 * with a CSPRNG source before production use.
 *
 * @returns A pseudo-random token string.
 */
export function makeRegistrationToken(): string {
  const lo = Math.random().toString(36).slice(2);
  const hi = Math.random().toString(36).slice(2);
  return `${Date.now().toString(36)}-${lo}${hi}`;
}
