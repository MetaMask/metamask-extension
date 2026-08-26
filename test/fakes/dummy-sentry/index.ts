/**
 * No-op stand-in for `@sentry/minimal`, resolved in for Ledger DMK packages
 * (`@ledgerhq/device-management-kit`, `@ledgerhq/device-transport-kit-web-hid`)
 * so the real Sentry graph is not bundled into the offscreen document.
 */
export function captureException(_exception?: unknown): undefined {
  return undefined;
}
