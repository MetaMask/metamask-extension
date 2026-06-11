# Playwright E2E

This folder hosts the Playwright runner setup for E2E tests. Three flavors coexist here:

| Folder          | Purpose                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `swap/`         | Original Playwright swap tests (`yarn test:e2e:swap`)                                              |
| `global/`       | Original Playwright global tests (`yarn test:e2e:global`)                                          |
| `benchmark/`    | Performance benchmarks (`yarn test:e2e:benchmark`)                                                 |
| `shared/`       | Shared harnesses used by the Selenium-to-Playwright migration (Chrome + Firefox extension loaders) |
| `llm-workflow/` | MCP-driven test scaffolding helpers                                                                |

The bulk of the existing E2E suite still lives under `test/e2e/tests/` and runs through Selenium. New Playwright migrations also live there with a `*.pw.spec.ts` suffix.

---

## Selenium → Playwright migration

- Selenium spec files (`*.spec.ts`) run via Mocha (`yarn test:e2e:chrome` / `yarn test:e2e:firefox`).
- Playwright spec files (`*.pw.spec.ts`) run via Playwright's runner (`yarn test:e2e:playwright:chrome` / `yarn test:e2e:playwright:firefox`).
- Both share the same `withFixtures`, page objects, flows, fixtures, and seeders. The only adapter is the **`PlaywrightDriver` shim** in `test/e2e/webdriver/driver-playwright.ts`, which mirrors the Selenium `Driver` public API on top of Playwright.

### File naming

Migration ships one file at a time:

- Add `auto-lock.pw.spec.ts` next to `auto-lock.spec.ts`.
- Verify it passes in CI under the new `test-e2e-chrome-playwright` / `test-e2e-firefox-playwright` jobs.
- Delete the Selenium `auto-lock.spec.ts` in the same PR (or a fast follow-up).

The Selenium runner (`test/e2e/run-all.mts`) and the changed-file filter (`test/e2e/changedFilesUtil.js`) explicitly skip `*.pw.spec.ts`, so a `.spec.ts` file and its `.pw.spec.ts` migration can coexist briefly without double-running.

### Writing a migrated spec

Start from the Selenium version and apply these mechanical changes:

1. Replace the Mocha imports with `import { test as pwTest } from '@playwright/test'`.
2. Wrap your test in `pwTest.describe(...)` / `pwTest(...)` instead of `describe` / `it`.
3. Inside `withFixtures`, pass `driverType: E2E_DRIVER.PLAYWRIGHT` (from `test/e2e/constants.ts`).
4. Use `testInfo.titlePath.join(' ')` for the `title` field instead of `this.test?.fullTitle()`.
5. Leave **everything else unchanged** — page objects, flows, fixtures, helpers.

Reference: [`test/e2e/tests/settings/auto-lock.pw.spec.ts`](../tests/settings/auto-lock.pw.spec.ts).

### Running locally

```bash
# Build the test extension (one-time, or after extension code changes)
yarn build:test          # Chrome MV3
yarn build:test:mv2      # Firefox MV2

# Run all migrated Playwright specs
yarn test:e2e:playwright:chrome
yarn test:e2e:playwright:firefox

# Run a single spec
yarn playwright test --project=chrome-e2e auto-lock.pw.spec.ts

# Verbose driver logs (`[driver] Called 'method' with arguments ...`),
# same proxy wrapper Selenium uses in `helpers.js`.
E2E_DEBUG=true yarn test:e2e:playwright:chrome auto-lock.pw.spec.ts

# Debug a spec (headed + PWDEBUG step inspector)
PWDEBUG=1 yarn playwright test --project=chrome-e2e auto-lock.pw.spec.ts

# Local sharding sanity-check (mirrors what CI does)
yarn test:e2e:playwright:chrome --shard=1/2
yarn test:e2e:playwright:chrome --shard=2/2
```

The Firefox path additionally requires `yarn playwright install firefox` once per machine (CI does this automatically via the `playwright-browsers: firefox` input on the reusable workflow, which routes through the cached `install-playwright-browsers` composite action).

### Architecture pointers

- **Driver shim**: [`test/e2e/webdriver/driver-playwright.ts`](../webdriver/driver-playwright.ts) — `PlaywrightDriver` + `PlaywrightElement`.
- **Factory**: [`test/e2e/webdriver/build-playwright-driver.ts`](../webdriver/build-playwright-driver.ts) — dispatches between Chrome/Firefox harnesses.
- **Chrome harness**: [`shared/chrome-extension-harness.ts`](./shared/chrome-extension-harness.ts) — `launchPersistentContext` + `--load-extension` + deterministic extension-ID derivation.
- **Firefox harness**: [`shared/firefox-extension-harness.ts`](./shared/firefox-extension-harness.ts) — Playwright Firefox `omni.ja` patch + RDP install + UUID lookup.
- **withFixtures branch**: [`test/e2e/helpers.js`](../helpers.js) — `driverType` from [`E2E_DRIVER`](../constants.ts) (`SELENIUM` default, `PLAYWRIGHT` for migrated specs).

### Unsupported on the Playwright path (yet)

The `PlaywrightDriver` shim covers what the easiest migrated specs need. Less-common methods throw a clear `not yet implemented` error pointing at the gap. When you migrate a spec that hits one of these, fill it in alongside the spec migration in the same PR. Notable current gaps:

- `pasteIntoField`
- `holdMouseDownOnElement`
- `clickPoint`
- `waitForElementToStopMoving`
- `switchToFrame`
- `virtualAuthenticator` flows
- Selenium-specific CDP listeners (`checkBrowserForExceptions`, `checkBrowserForConsoleErrors` are no-ops on the PW path; `weberror` events are recorded automatically)

### CI

- New jobs: `test-e2e-chrome-playwright` (in `.github/workflows/e2e-chrome.yml`) and `test-e2e-firefox-playwright` (in `.github/workflows/e2e-firefox.yml`). Both use the existing `run-e2e.yml` reusable workflow.
- JUnit XML lands at `test/test-results/e2e/junit-pw-<browser>.xml`, gets uploaded with the rest of the e2e artifacts, and feeds into the existing `test-e2e-*-report` job that already aggregates `test/test-results/e2e/`.
- Reporting compatibility is handled by a small Playwright reporter at [`shared/mocha-compat-junit-reporter.ts`](./shared/mocha-compat-junit-reporter.ts). Playwright's built-in `junit` reporter omits the `file=` attribute and the `<properties>` block that `.github/scripts/create-e2e-test-report.mts` requires; the adapter emits a `mocha-junit-reporter`-shaped XML so migrated specs appear in the existing chrome/firefox reports. It activates only when `PLAYWRIGHT_JUNIT_OUTPUT_FILE` is set, so the swap/global/benchmark Playwright projects are unaffected.
- No matrix sharding while we're at one migrated spec. Reintroduce sharding when the migrated suite grows past ~15 minutes serial.
