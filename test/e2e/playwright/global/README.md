# Playwright Firefox Extension PoC

This folder contains `firefox-extension-poc.spec.ts`, a minimal proof-of-concept for running the MetaMask Firefox extension with Playwright.

## Why this PoC exists

- Playwright does not expose a first-class Firefox extension loading API comparable to Chromium `--load-extension`.
- The old `firefox.connect({ wsEndpoint })`-style extension flow from early issue reports was acknowledged by Playwright maintainers as never officially supported.
- We validated that policy-based preinstall (`PLAYWRIGHT_FIREFOX_POLICIES_JSON`) alone is not enough for MetaMask in this setup, and moved to an RDP + patched Firefox harness.

References:

- [Playwright issue #7297](https://github.com/microsoft/playwright/issues/7297#issuecomment-3333317209)
- [Playwright PR #35926](https://github.com/microsoft/playwright/pull/35926)
- [Playwright BrowserType docs](https://playwright.dev/docs/api/class-browsertype)
- [Mozilla ExtensionSettings policy docs](https://mozilla.github.io/policy-templates/#extensionsettings)
- [DuckDuckGo experimental Firefox harness PR](https://github.com/duckduckgo/duckduckgo-privacy-extension/pull/3520)

## Issues found and fixes applied

### 1) Policy install failed on unsigned XPI

Observed error:

- `Download failed - ERROR_SIGNEDSTATE_REQUIRED - file:///.../metamask-....xpi`

Root cause:

- Firefox enterprise policy install path enforces signed-state checks for this runtime path.

Fix:

- Switched from policy-only install to Remote Debugging Protocol temporary add-on install (`installTemporaryAddon`).
- Implementation lives in `test/e2e/playwright/shared/firefox-extension-harness.ts` via `installTemporaryAddonViaRdp`.

### 2) Extension installed, but Playwright only saw blank pages

Observed symptom:

- Browser visibly showed MetaMask login, but Playwright `context.pages()` remained `about:blank` pages.
- `page.goto(moz-extension://.../home.html)` timed out.

Root cause:

- Juggler could not reliably interact with `moz-extension://` pages in bundled Playwright Firefox defaults.

Fix:

- Added an experimental patch step `ensurePatchedPlaywrightFirefox()` that updates bundled Firefox internals:
  - Patches `omni.ja` to enable `EXPERIMENTS_ENABLED`.
  - Patches Juggler code to disable the `moz-extension://` early return.
  - Appends `lockPref("marionette.running", true);` in `playwright.cfg`.
- After patching, `moz-extension://.../home.html` became Playwright-reachable.

### 3) UI readiness and balance assertions were flaky

Observed symptom:

- Extension page reachable, but selectors were not immediately present.
- Balance assertion could read empty string before render settled.

Fix:

- Added readiness wait for `.controller-loaded`.
- Added unlock/home screen diagnostics.
- Changed balance assertion to `expect.poll(...).toContain('ETH')` for async UI stabilization.

## Validated command

Run the PoC in headless CI mode:

```bash
CI=1 yarn playwright test --project=firefox-extension-poc --retries=0
```

Current expected result:

- Add-on installs successfully.
- Extension URL is reachable from Playwright.
- Wallet unlock succeeds.
- ETH balance check passes.

## Current constraints

- This is an experimental harness workaround, not a native Playwright Firefox extension API.
- It depends on patching Playwright's bundled Firefox internals at runtime.
- The internal `moz-extension://<uuid>` identifier is dynamic and discovered from profile prefs.
- Stability can vary by Firefox runtime/channel and host OS.

## Suggested next migration steps

1. Extract the PoC launch flow into shared Playwright E2E setup when reliability is confirmed in CI.
2. Add a second Firefox Playwright smoke test (e.g. open account menu) to validate repeatability.
3. Gate broader Selenium-to-Playwright migration on deterministic startup metrics for this path.
