# Autoresearch Ideas Backlog — E2E Setup Time

This file is maintained by the autoresearch agent. Track ideas to try and what has been tried.

## Untried Ideas

### Firefox

- [ ] Pre-build XPI and cache in `os.tmpdir()` — invalidate when `dist/firefox` files change (mtime or manifest hash)
- [ ] Lazy-load Firefox profile preferences
- [ ] Reduce Firefox startup flags (disable features not needed for E2E)

### Chrome

- [ ] Use `--load-extension` with pre-computed ID to avoid lookup (if deterministic ID is available)

### Shared (helpers, driver, index)

- [ ] Parallelize driver build and fixture server startup (other combinations)
- [ ] Reduce `waitForControllers` polling interval or timeout
- [ ] Lazy-initialize driver until first navigation
- [ ] Cache driver across tests in same process (if applicable)

## Tried — Successful

- **Chrome: `--no-first-run` + `--disable-default-apps`** — 19s → 14s (-5s)
- **Chrome: `--disable-gpu` always** — 14s → 13s (-1s)

## Tried — Failed / No Improvement

- **Chrome: getExtensionIdByName retry sleep 1000ms→500ms** — No improvement (13s)
- **Chrome: `--disable-sync` + `--disable-translate`** — Regression (14s vs 13s best)
- **Chrome: `--disable-background-networking`** — Regression (14s vs 13s best)
- **Firefox: disable telemetry + checkDefaultBrowser** — 24s (no Chrome baseline to beat; reverted)
- **helpers: parallelize fixtureServer + phishingPageServer** — mean 14s (16,13,13) vs 13s best
- **helpers: parallelize mockServer.start + setManifestFlags** — mean 13s (13,14,13), no improvement
- **Chrome: `--disable-software-rasterizer`** — mean 13s (13,14,13), no improvement
- **Chrome: `--disable-domain-reliability`** — mean 13s (13,13,13), no improvement
- **helpers: parallelize dapp server startup** — mean 13s (13,13,14), no improvement
- **Chrome: getExtensionIdByName maxAttempts 5→4** — mean 13s (14,13,13), no improvement
- **Chrome: `--disable-breakpad`** — mean 13s (13,14,13), no improvement
- **Chrome: `--disable-client-side-phishing-detection`** — mean 14s (14,13,14), regression
- **Chrome: `--disable-hang-monitor`** — mean 13s (13,13,14), no improvement
- **Chrome: `--no-default-browser-check`** — mean 13s (13,14,13), no improvement
- **Chrome: getExtensionIdByName retry sleep 1000ms→300ms** — mean 13s (14,13,13), no improvement

## Done in Separate PRs (omit from this branch)

- **Chrome: Compute extension ID from manifest key** — implemented elsewhere
- **Firefox: Use `zip -1` for XPI compression** — implemented elsewhere

## Tried — Crashed / Invalid

_None yet._
