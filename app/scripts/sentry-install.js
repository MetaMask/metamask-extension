import setupSentry from './lib/setupSentry';

// The root compartment will populate this with hooks
global.stateHooks = global.stateHooks || {};

// setup sentry error reporting
// Wrapped in try-catch because getManifestFlags() may fail in offscreen
// documents during E2E test reloads where chrome.runtime.getManifest
// is not yet available. Without this guard, the entire script crashes
// and prevents offscreen-only features (e.g. Ledger bridge) from working.
try {
  global.sentry = setupSentry();
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn(
    '[sentry-install] setupSentry failed, continuing without Sentry:',
    err?.message,
  );
}
