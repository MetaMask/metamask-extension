/**
 * No-op stand-in for `@sentry/minimal`, resolved in for Ledger DMK packages
 * (`@ledgerhq/device-management-kit`, `@ledgerhq/device-transport-kit-web-hid`)
 * so the real Sentry graph is not bundled into the offscreen document.
 *
 * Plain JS (not TS): webpack resolves this via `node_modules/@sentry/minimal`
 * and does not run the TypeScript loader on that path.
 *
 * @param {*} _exception - Ignored; present only to match `@sentry/minimal`'s API.
 * @returns {undefined}
 */
export function captureException(_exception) {
  return undefined;
}
