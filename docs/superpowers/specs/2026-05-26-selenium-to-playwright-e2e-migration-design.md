# Selenium → Playwright E2E Migration — Design

**Date:** 2026-05-26
**Status:** Draft — pending implementation
**Branch context:** Builds on `test-poc-ff-pw`, which proved Playwright can drive the MetaMask extension on Firefox via an RDP + patched-Juggler harness.

---

## 1. Goal

Migrate every Mocha-driven Selenium E2E spec under `test/e2e/tests/**` to a Playwright spec, with the two systems co-existing during the migration so the suite never goes red. After migration, delete the Selenium setup entirely (driver, mocha config, Selenium CI suites, dependencies).

**Non-goals (for this plan):**

- Parallel Playwright workers within a single CI shard (port refactor). Deferred.
- Migrating `api-specs`, `multi-provider`, `rpc`, `benchmark`, `flask`-only, `dist`-only suites. Phase 2.
- Replacing `mockttp`, Anvil/Ganache, fixture-server, dapp-server, websocket registry. All kept as-is.
- Rewriting page objects to use idiomatic Playwright patterns. Opportunistic fixes only.
- Migrating `test/integration/`.

---

## 2. Approach summary

| Decision                             | Choice                                                                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Page object reuse                    | Build a **Playwright-backed `Driver` shim** that implements the same interface as `test/e2e/webdriver/driver.js`. Page objects and flow files stay unchanged.                                          |
| Per-spec workflow                    | One spec at a time. Migration PR replaces the Selenium spec with the Playwright version and deletes the Selenium file.                                                                                 |
| Test runner                          | `@playwright/test`.                                                                                                                                                                                    |
| `withFixtures`                       | Refactor `test/e2e/helpers.js`'s `withFixtures` to be **browser-agnostic** — same fixture orchestration, picks the right driver based on a `driverType` option (or runner auto-detect).                |
| CI shape                             | Add `test-e2e-{chrome,firefox}-playwright-webpack` jobs in the existing `e2e-{chrome,firefox}.yml`, reusing `run-e2e.yml` and the existing sharded matrix.                                             |
| Build artifacts                      | Reuse the existing `build-test-webpack` / `build-test-mv2-webpack` artifacts. (Browserify is being deprecated.)                                                                                        |
| Reporting                            | Playwright emits JUnit into the same `test/test-results/e2e/` folder; the existing aggregator (`create-e2e-test-report.mts`) picks it up unchanged. PW HTML report + traces are uploaded as artifacts. |
| Spec naming                          | `.pw.spec.ts` during the migration window; renamed to `.spec.ts` in the final teardown PR after the Selenium counterpart is gone.                                                                      |
| Migration order                      | Easiest first — short specs with no dapp interaction and no window switching.                                                                                                                          |
| Ownership                            | Dedicated platform team.                                                                                                                                                                               |
| New specs policy during migration    | Either Selenium or Playwright is allowed. The policy will flip to "Playwright required" once **>70% of specs are migrated** (concrete trigger date deferred).                                          |
| Sharding                             | Reuse the existing matrix (`matrix-index` / `matrix-total` env vars) via PW's `--shard=N/M` flag. Per-shard worker count = 1 (no port refactor).                                                       |
| Selenium removal                     | Hard cutover in a single teardown PR once zero `.spec.ts` Selenium files remain.                                                                                                                       |
| Firefox harness                      | Accept the bundled-Firefox `omni.ja` + Juggler patch from the POC. Pin `@playwright/test` version. Document the patch + upgrade procedure.                                                             |
| Chrome MV3 loading                   | `chromium.launchPersistentContext` with `--load-extension` + `--disable-extensions-except`, wait on `context.serviceWorkers()` (with polling fallback).                                                |
| Shim fidelity                        | Smart fidelity — match API signatures, let PW auto-waiting work. If a page object breaks because PW reveals a real fragile selector, fix it as part of that spec's migration PR.                       |
| Definition-of-done per migrated spec | Green in CI once. Reviewer sanity check. Lint passes.                                                                                                                                                  |

---

## 3. Architecture

### 3.1 The `PlaywrightDriver` shim

Lives at `test/e2e/webdriver/driver-playwright.ts`. Implements the same public API as the existing Selenium `Driver` so every page object and flow can consume it via the existing `Driver` type without modification.

**Internal state:**

- `context: BrowserContext` — the PW persistent context that owns the extension.
- `currentPage: Page` — the page currently in focus. Analogous to Selenium's "current window".
- `pages: Map<string, Page>` — synthetic string handles → PW `Page`. New pages auto-register via `context.on('page', …)`; closed pages are evicted.
- `extensionId: string`, `extensionUrl: string`.
- `this.Key` constants — the same Selenium key codes (`'\uE007'` etc.) mapped to Playwright keyboard strings (`'Enter'`, `'Backspace'`, …) inside `press`.
- `windowHandles` — same `WindowHandles` instance used by the Selenium driver, talking to `getServerMochaToBackground()` (runner-agnostic despite the name).

**Locator translation (`buildLocator`):** Ported from `webdriver/driver.js`. Input shapes (`{ css }`, `{ testId }`, `{ tag, text }`, `{ xpath }`, `{ css, text }`, `{ css, value }`) are translated to PW `Locator` instances. The `css + text` and `css + value` cases reuse the existing `cssToXPath` synthesis; the resulting XPath string is passed to `page.locator('xpath=...')`. Element-level method shape (`element.fill`, `element.press`, `element.waitForElementState`, `element.click`) maps directly onto PW `Locator` methods — but the shim must preserve the Selenium-flavored `getText()`, the custom `click()` that retries past `.loading-overlay` / `.modal__backdrop`, and `element.originalClick` so existing call sites stay correct.

**Window/tab translation (synthetic handles):**

- `getAllWindowHandles()` → `Array.from(this.pages.keys())`.
- `switchToWindow(handle)` → updates `this.currentPage` from the map; throws if unknown.
- `switchToWindowWithTitle(title)` / `switchToWindowWithUrl(url)` → polls `await page.title()` / `page.url()` across `context.pages()` until one matches; assigns a handle.
- `switchToNewWindow()` → waits for the next `context.on('page')` event.
- `closeWindow()` / `closeWindowHandle(handle)` → closes the PW page + removes it from the map.
- `waitUntilXWindowHandles(n, ...)` → polls `context.pages().length` until it equals `n` or times out.

**Unimplemented method policy:** Every method on the Selenium `Driver` that is not implemented in the PW shim is added as a stub that throws a clear message (`'PlaywrightDriver: method X not yet implemented; needed by <caller>'`). This keeps unimplemented coverage immediately visible in failing tests rather than hiding behind silent no-ops.

**Page object impact:** None expected for the common case. When PW's auto-waiting exposes a real selector or timing bug that the Selenium loops were masking, that page object is fixed as part of the spec's migration PR (Smart Fidelity).

### 3.2 `withFixtures` refactor — browser-agnostic

`test/e2e/helpers.js` exports `withFixtures(options, testSuite)`. Refactor:

- Accept an additional `driverType?: 'selenium' | 'playwright'` option. Default behavior: auto-detect (`'playwright'` if `process.env.PW_TEST` is set or if the function is called from a PW test fixture; `'selenium'` otherwise).
- Extract `buildDriverForRunner(driverType, options)` that returns either a Selenium `Driver` (via the existing `buildWebDriver`) or a `PlaywrightDriver` (via a new `buildPlaywrightDriver` in `webdriver/driver-playwright.ts`).
- All other orchestration is unchanged: fixture-server, mockttp, Anvil/Ganache, dapp servers, phishing-page-server, bundler, websocket registry, manifest flags, virtual-authenticator setup.
- Ports stay fixed (workers=1 per shard).
- The `TestSuiteArguments` object passed to the test body keeps the same shape (`{ driver, contractRegistry, localNodes, mockServer, mockedEndpoint, … }`).

Effect: a migration PR for a confirmation spec calls the same `withTransactionEnvelopeTypeFixtures(...)` from `test/e2e/tests/confirmations/helpers.ts`, the same `login()` flow, the same `TestDapp` page object — only the test wrapper changes (Mocha `describe`/`it` → PW `test.describe`/`test`).

### 3.3 Extension harnesses

`test/e2e/playwright/shared/`:

- `firefox-extension-harness.ts` (already in branch) — RDP install + `ensurePatchedPlaywrightFirefox` (omni.ja + Juggler patch + `marionette.running` lockPref). Will be polished and made the public API.
- `chrome-extension-harness.ts` (**new**) — `launchChromeWithExtension({ extensionPath, headless })`:
  - `chromium.launchPersistentContext` with `--load-extension=<dist/webpack>` and `--disable-extensions-except=<dist/webpack>`.
  - Polls `context.serviceWorkers()` for up to ~30s for the MetaMask SW.
  - Discovers the extension ID from the SW URL (`chrome-extension://<id>/...`).
  - Returns `{ context, extensionId, extensionUrl }`.
  - Falls back to parsing `chrome://extensions/` if the SW poll times out (mirrors the FF harness's `about:debugging` parsing).

Both harnesses are consumed by `buildPlaywrightDriver(browser, options)` which wraps the returned context + extension info into a `PlaywrightDriver` instance.

---

## 4. CI

### 4.1 Reuse

- `run-e2e.yml` is **unchanged** — it already accepts `build-artifact`, `build-command`, `pre-test-command`, `test-command`, and matrix params. The PW POC job already proved this pattern works.
- The existing matrix generator (the upstream job that produces `inputs.use-matrix`) is extended to include `test-e2e-chrome-playwright-webpack` and `test-e2e-firefox-playwright-webpack` suite keys. The splitter splits `.pw.spec.ts` files across shards using the same mechanism it uses for `.spec.ts` today.

### 4.2 New jobs

In `.github/workflows/e2e-chrome.yml`, add (mirrors `test-e2e-chrome-webpack`):

```yaml
test-e2e-chrome-playwright-webpack:
  uses: ./.github/workflows/run-e2e.yml
  secrets:
    INFURA_PROJECT_ID: ${{ secrets.INFURA_PROJECT_ID }}
  strategy:
    fail-fast: ${{ github.event_name == 'merge_group' }}
    matrix: ${{ fromJson(inputs.use-matrix)['test-e2e-chrome-playwright-webpack'] }}
  with:
    test-suite-name: test-e2e-chrome-playwright-webpack
    build-artifact: build-test-webpack
    build-command: yarn build:test:webpack
    pre-test-command: yarn playwright install chromium
    test-command: yarn test:e2e:playwright:chrome
    builds-from-run: ${{ inputs.builds-from-run }}
    matrix-index: ${{ matrix.index }}
    matrix-total: ${{ strategy.job-total }}
```

In `.github/workflows/e2e-firefox.yml`, add (mirrors `test-e2e-firefox-webpack`):

```yaml
test-e2e-firefox-playwright-webpack:
  uses: ./.github/workflows/run-e2e.yml
  secrets:
    INFURA_PROJECT_ID: ${{ secrets.INFURA_PROJECT_ID }}
  strategy:
    fail-fast: ${{ github.event_name == 'merge_group' }}
    matrix: ${{ fromJson(inputs.use-matrix)['test-e2e-firefox-playwright-webpack'] }}
  with:
    test-suite-name: test-e2e-firefox-playwright-webpack
    build-artifact: build-test-mv2-webpack
    build-command: yarn build:test:webpack:mv2
    pre-test-command: yarn playwright install firefox
    test-command: yarn test:e2e:playwright:firefox
    builds-from-run: ${{ inputs.builds-from-run }}
    matrix-index: ${{ matrix.index }}
    matrix-total: ${{ strategy.job-total }}
```

Both jobs are added to the `needs:` list of the existing `test-e2e-{chrome,firefox}-report` rollup so the unified report aggregates them.

The temporary `test-e2e-firefox-playwright-poc` job in `e2e-firefox.yml` is **deleted** in the M1 PR — its coverage is subsumed by the new `test-e2e-firefox-playwright-webpack`.

### 4.3 New `package.json` scripts

```json
"test:e2e:playwright:chrome": "playwright test --project=chrome-e2e --shard=${MATRIX_INDEX:-0}/${MATRIX_TOTAL:-1}",
"test:e2e:playwright:firefox": "playwright test --project=firefox-e2e --shard=${MATRIX_INDEX:-0}/${MATRIX_TOTAL:-1}"
```

(Plus a `MATRIX_INDEX_PLUS_ONE` shim or equivalent, since PW expects 1-indexed shards.)

### 4.4 `playwright.config.ts` changes

Add two new projects:

```ts
{
  name: 'chrome-e2e',
  testDir: 'test/e2e/tests',
  testMatch: '**/*.pw.spec.ts',
  use: { ...devices['Desktop Chrome'], headless: Boolean(process.env.CI) },
  workers: 1,
  fullyParallel: false,
},
{
  name: 'firefox-e2e',
  testDir: 'test/e2e/tests',
  testMatch: '**/*.pw.spec.ts',
  use: { ...devices['Desktop Firefox'], headless: Boolean(process.env.CI) },
  workers: 1,
  fullyParallel: false,
},
```

Extend `reporter` to write JUnit into `test/test-results/e2e/` (the same folder `mocha-junit-reporter` writes to) and HTML/traces into `test-artifacts/`:

```ts
reporter: [
  ['list'],
  ['junit', { outputFile: 'test/test-results/e2e/junit-pw-${SHARD}.xml' }],
  ['html', { outputFolder: 'test-artifacts/playwright-html', open: 'never' }],
],
```

Verify in M1 that `create-e2e-test-report.mts` correctly aggregates PW junit alongside Mocha junit. If schemas differ, add a small normalizer step to the aggregator (preferred over twisting the reporter).

---

## 5. Rollout plan

### M1 — Foundations PR

Single PR by the platform team. Ships everything needed for the first real migrations:

- `webdriver/driver-playwright.ts` — `PlaywrightDriver` class implementing the subset of `Driver` API needed by the example specs + the most commonly used methods. Unimplemented methods stub to clear-error throws.
- `webdriver/build-playwright-driver.ts` — `buildPlaywrightDriver({ browser, options })` factory.
- `playwright/shared/chrome-extension-harness.ts` — new.
- `playwright/shared/firefox-extension-harness.ts` — promoted from the POC into the public shared API.
- `test/e2e/helpers.js` — `withFixtures` refactored to be browser-agnostic.
- `test/e2e/run-all.mts` — Selenium discovery filter updated to **exclude** `.pw.spec.ts` files (current condition is `endsWith('.spec.js') || endsWith('.spec.ts')`, which would otherwise match the PW files and feed them to Mocha). Same fix in `changedFilesUtil.js` if it filters by the same pattern.
- `playwright.config.ts` — new `chrome-e2e` and `firefox-e2e` projects, JUnit/HTML reporters wired up.
- `package.json` — pin `@playwright/test` version (no caret); add `test:e2e:playwright:chrome` / `test:e2e:playwright:firefox` scripts.
- **2-3 example spec migrations.** Selection criteria: short (< 50 lines), no dapp, no window switching, no contract deployment. Candidates include onboarding-metrics, a settings spec, an account-details spec. Each is renamed `.spec.ts` → `.pw.spec.ts` with the Selenium version deleted in the same commit.
- `.github/workflows/e2e-chrome.yml` and `e2e-firefox.yml` — new jobs added, added to `needs:` of the report job. Delete `test-e2e-firefox-playwright-poc`.
- Matrix generator updated to recognise the two new suite keys and split `.pw.spec.ts` files.
- `test/e2e/playwright/README.md` (new or refreshed) — migration guide + how to run the new jobs locally + how to add a new PW spec.
- `test/e2e/AGENTS.md` updated with a section on the dual-runner state and a pointer to the migration guide.
- LavaMoat run (`yarn lavamoat:auto`) for any new transitive dependency surface.

### M2..Mn — Migration PRs

Steady stream of small PRs (3-5 specs per PR), starting from the "easiest first" list maintained externally by the platform team.

Per-spec checklist:

1. Rename `foo.spec.ts` → `foo.pw.spec.ts`.
2. Rewrite the wrapper: Mocha `describe`/`it`/`function() {}` → PW `test.describe`/`test`/`async ({ }) => { }`. Replace `this.test?.fullTitle()` → `test.info().titlePath.join(' ')`. Replace `this.timeout(X)` → `test.setTimeout(X)`.
3. Keep all page object / flow / helper imports unchanged. Keep the `withFixtures` call body unchanged.
4. Delete the original Selenium `foo.spec.ts`.
5. Run locally on the relevant browser(s) at least once.
6. Definition-of-done: lint passes; CI green on the new PW job once.

If a migration uncovers a `PlaywrightDriver` API gap (a stub throws), the same PR adds the missing implementation to the shim. If a page object selector becomes brittle under PW auto-wait, the same PR fixes the page object.

### M_final — Selenium teardown PR(s)

Triggered when zero `.spec.ts` files remain in `test/e2e/tests/`. Single (or 2-3 small) PR(s):

- Delete `test/e2e/webdriver/{driver.js, chrome.js, firefox.js, index.js, virtual-authenticator.ts, types.ts}`. Update or move `webdriver/README.md`.
- Strip the Selenium branches from `withFixtures`. Inline `buildDriverForRunner` if it becomes trivial.
- Rename `getServerMochaToBackground` → `getServerToBackground` (or similar) and update call sites.
- Remove the Selenium CI suites (`test-e2e-{chrome,firefox}-{browserify,webpack,flask,dist}` jobs) from `e2e-chrome.yml` / `e2e-firefox.yml`. Update their report-job `needs:` lists.
- Drop `selenium-webdriver`, `mocha`, `mocha-junit-reporter` (if unused elsewhere), `geckodriver`, `chromedriver` from `package.json`.
- Run `yarn lavamoat:auto`, `yarn attributions:generate`, `yarn lint:lockfile:dedupe:fix`.
- Mechanical rename: all `.pw.spec.ts` → `.spec.ts` (single commit; ideally a codemod-driven `git mv` so history is preserved).
- Update `test/e2e/AGENTS.md`, the E2E Decision Tree doc, and `.cursor/rules/e2e-testing-guidelines/RULE.md` to remove Selenium references.

### Phase 2 (post-M_final)

Migrate the special suites that were out of scope of the primary plan: `api-specs`, `multi-provider`, `rpc`, `benchmark` (where not already PW), `flask`, `dist` variants. Each gets its own mini-plan; they share the `PlaywrightDriver` shim and harnesses delivered in M1.

### Cutoff trigger for "PW-required for new specs"

Once **more than 70% of E2E specs are migrated**, switch policy: new E2E specs must be Playwright. Until then, both are acceptable. The exact date for the switchover will be set when we hit the threshold.

---

## 6. Risks & mitigations

| ID  | Risk                                                                                                                                                    | Mitigation                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Driver shim API surface is large (~150 methods, some with subtle behavior — custom click loops, `findElementGuard`, `WindowHandles` socket).            | Implement incrementally per migration. Unimplemented methods throw a clear error so coverage gaps surface immediately. Track in the external backlog.                                                                                                   |
| R2  | PW auto-waiting changes timing semantics; tests passing in Selenium because of explicit delays or retry-on-overlay may fail or hide flakes differently. | Smart Fidelity is the accepted policy: fix page objects when PW reveals real bugs. Keep `delay()` as a no-op-with-warning. If a spec flakes post-merge, roll it back to Selenium until fixed.                                                           |
| R3  | `getServerMochaToBackground` / `background-socket` is Mocha-named but runner-agnostic in practice; downstream readers may worry about runner coupling.  | The shim's `WindowHandles` continues to use it unchanged. Rename in the M_final teardown PR.                                                                                                                                                            |
| R4  | Firefox `omni.ja` + Juggler patch is fragile and tied to a specific Playwright version.                                                                 | Pin `@playwright/test` exactly (no caret). PW Firefox job runs on every PR — patch breakage surfaces immediately. Document the patch and the upgrade checklist in `test/e2e/playwright/README.md`. Revisit quarterly for upstream support.              |
| R5  | Chrome MV3 service-worker quirks (sleep/eviction, late startup).                                                                                        | `chrome-extension-harness.ts` polls `context.serviceWorkers()` for up to ~30s. Falls back to parsing `chrome://extensions/` if SW poll times out. `WindowHandles` socket reconnect handles mid-test eviction; verify in M1.                             |
| R6  | Coverage drift while both Selenium and PW are accepted for new specs (same flow covered twice or not at all).                                           | Platform team curates the migration backlog externally. New PW specs encouraged in docs; Selenium discouraged but not blocked. Flip to PW-required at >70% migration.                                                                                   |
| R7  | Locator translation edge cases — `{ css, value }`, `{ css, text }` need non-trivial XPath synthesis.                                                    | Port the existing `cssToXPath` logic into the shim's `buildLocator`. PW supports `page.locator('xpath=...')` so translated XPath strings work as-is. Unit-test `buildLocator` against a fixture HTML page in M1.                                        |
| R8  | `create-e2e-test-report.mts` assumes `mocha-junit-reporter` schema (suite/test naming, properties tags).                                                | Verify in M1 by running the aggregator over PW JUnit output. If schema differs, add a tiny normalizer step in the aggregator. Configure PW's JUnit reporter naming and properties options to match where possible.                                      |
| R9  | Sharding granularity — PW shards by test, the current Selenium matrix shards by file.                                                                   | PW's `--shard=N/M` is deterministic and balances by test count; it works out of the box with the existing `matrix-index` / `matrix-total` env vars. Don't consume `test-runs-for-splitting` for PW jobs in M1. Revisit only if shard balance is uneven. |

---

## 7. Success criteria

- M1 ships with the PW Chrome + Firefox suites green on 2-3 migrated specs.
- The unified test report (`create-e2e-test-report.mts` output) shows both Selenium and PW results in one view, no schema breakage.
- Per-spec migration PRs take ~30 minutes of review time on average (no surprises from the shim).
- No regression in CI duration for un-migrated specs (Selenium suites unchanged).
- M_final ships with `selenium-webdriver` and `mocha` removed from `package.json` and zero `.spec.ts` files in `test/e2e/tests/` that still import `webdriver/driver`.
