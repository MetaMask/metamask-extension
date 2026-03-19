# Autoresearch: E2E Setup Time Optimization

## Objective

Reduce the wall-clock **E2E setup time** — the time from starting a test until the extension is ready (browser open, extension injected, `waitForControllers` loaded). This excludes building the wallet; the test build is assumed to exist.

We use the **total duration of the first send-eth test** as the metric. Setup dominates this time, so improvements to WebDriver/extension loading directly reduce the measured value.

## Primary Metric

**`setup_time_seconds`** — Wall-clock time to run the first send-eth test (`yarn test:e2e:single ... --grep 'sends ETH'`). Lower is better.

An experiment is a **SUCCESS** if `setup_time_seconds` is lower than the current best AND all checks pass. Even a 1s improvement counts.

## Correctness Gate

Run `autoresearch.checks.sh` BEFORE measuring. If checks fail, the experiment is DISCARDED.

The checks verify:
1. Modified files are within allowed scope
2. No syntax errors in modified JS files
3. `package.json` and `yarn.lock` unchanged
4. Frozen files (this file, program.md, scripts) unchanged

## Files In Scope (you MAY modify these)

```
test/e2e/webdriver/chrome.js      # Chrome WebDriver build, extension loading
test/e2e/webdriver/firefox.js     # Firefox WebDriver build, extension loading
test/e2e/helpers.js               # withFixtures, buildWebDriver orchestration
test/e2e/webdriver/driver.js      # Driver class, navigate, waitForControllers
test/e2e/webdriver/index.js       # buildWebDriver entry, browser selection
development/autoresearch/autoresearch.ideas.md  # Ideas backlog (update after each experiment)
```

## Files FROZEN (you must NOT modify these)

```
development/autoresearch/autoresearch.sh
development/autoresearch/autoresearch.checks.sh
development/autoresearch/autoresearch.md
development/autoresearch/program.md
test/e2e/tests/send/send-eth.spec.ts   # Use as-is, do not create new tests
package.json
yarn.lock
```

## Constraints

1. **Use existing send-eth test** — Do not create new tests. The benchmark runs `send-eth.spec.ts` with `--grep 'sends ETH'`.
2. **No dependency changes** — Do not add, remove, or update packages.
3. **One change per experiment** — Make a single, focused change per iteration.
4. **Tests must pass** — The E2E test must complete successfully (all checks pass).

## Strategic Direction

Setup time is dominated by:
- **Firefox**: `installAddon()` zips the unpacked extension on every call (~10s). Caching a pre-built XPI helps.
- **Chrome**: Extension ID discovery via `chrome://extensions` scraping (~880ms). Computing the ID from `manifest.json` key when present avoids this.
- **Both**: `waitForControllers` wait, browser launch, proxy setup.

### High-value directions

- **Firefox XPI caching**: Pre-build a compressed XPI once, reuse across test runs. Invalidate when source files change.
- **Chrome deterministic ID**: When manifest has a `key`, compute extension ID locally instead of scraping.
- **Parallel or lazy initialization**: Defer work until needed.
- **Reduce waitForControllers polling**: If there's a faster readiness signal, use it.
- **Browser launch flags**: Disable unnecessary Chrome/Firefox features to speed startup.

### What has been tried (from prior work)

- Firefox XPI caching: ~82% reduction in installExtension time, ~73% overall setup improvement.
- Chrome deterministic ID: ~88% reduction in buildWebDriver time for Chrome.

## Experiment Protocol

1. Read this file and `autoresearch.ideas.md`
2. Pick ONE idea to try
3. Make the code change (single focused edit)
4. Run `./development/autoresearch/autoresearch.sh` (or `autoresearch.sh firefox` for Firefox)
5. Check the output:
   - `CHECKS: PASSED` and `setup_time_seconds` < current best → **SUCCESS** — commit with message `autoresearch: experiment N — Xs (-Ys) — <description>`
   - `CHECKS: FAILED` or `setup_time_seconds` >= current best → **FAILURE** — revert with `git checkout -- .`
6. Update `autoresearch.ideas.md`: move the idea to "Tried" with the result
7. Repeat from step 1
