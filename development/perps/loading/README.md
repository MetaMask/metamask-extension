# Perps loading measurements

Run repeatable Extension loading flows against a prepared wallet using mm-harness. The collector generates and plans a Recipe v1 graph for each sample, drives real UI actions, records browser timestamps and actual Sentry SDK events, and saves the complete recipe run and settled screenshot.

Two browser boundaries are reported separately:

- `entryToRowsMs`: the real Perps click to the first positive-priced, rendered DOM rows. For account switching, start at the actual account-row click and record the subsequent Perps-click delay separately.
- `entryToLiveMs`: the same start to every rendered row matching a finite positive quote in the current manager cache, with account identity and account/order/position caches available. This historical field name does not assert exchange-origin freshness or presented pixels.

The observer uses the same portable price formatter as the UI. It captures native frame scheduling and `Intl` before initialization so it works with LavaMoat scuttling. It does not alter readiness, application state, SDK implementations, consent, or wallet storage. Browser HTTP cache is disabled for the observation window on both builds and restored afterward. Cold samples additionally require a completed, uncached Terminal `/v1/perpetuals` response with nonzero bytes. That request proves backend access, not a per-row response-to-render correlation.

## Prepare and freeze

Use one isolated checkout, its existing canonical fixture/profile, and its recorded harness executable. Discover the installed contract with `mm-harness help --json`, inspect `status --json`, and use public `launch --verify` to prepare the runtime. Do not reset/reimport or accept Terms as part of a measurement. Resolve any required human wallet action before recording a cohort.

Create an untracked config, for example `temp/perps-loading/config.json`. Replace the example port, extension ID and account mapping with the values verified for your checkout. The config contains no credentials.

```json
{
  "harnessVersion": "0.50.5",
  "artifactsDir": "temp/perps-loading/evidence",
  "runtimeDir": "temp/recipe/runtime",
  "cdpPort": 7661,
  "extensionId": "hebhblbkkdabgoldnojllkipeoacjioc",
  "accounts": {
    "dev1": "verified-internal-account-id-1",
    "dev2": "verified-internal-account-id-2"
  },
  "requiredSpans": {
    "after": {
      "immediate": [
        "Perps Connection Establishment",
        "Perps Entry To Live Market List"
      ],
      "delayed": [
        "Perps Connection Establishment",
        "Perps Entry To Live Market List"
      ],
      "warm": ["Perps Entry To Live Market List"],
      "background_resume": ["Perps Entry To Live Market List"],
      "account": [
        "Perps Account Switch Reconnection",
        "Perps Entry To Live Market List"
      ]
    }
  }
}
```

SDK assertions require a build with the real SDK initialized and the existing consent/sampling configuration permitting local spans. If unavailable, omit `requiredSpans` and explicitly report SDK proof as unavailable; do not substitute browser timing for SDK timing. No remote Sentry ingestion is asserted by this tool.

For each arm, retain `<arm>-build-provenance.json` in the evidence directory:

```json
{
  "sourceRef": "exact-source-commit",
  "files": [
    { "file": "path-relative-to-runtime-dist", "sha256": "sha256-of-that-file" }
  ]
}
```

Include every runtime build file, generated from the frozen build. The collector verifies every listed hash before and after each sample. Keep source/build provenance from acquisition; do not generate a new expected manifest from an unverified runtime to make a mismatch pass. If public launch transforms manifest/HTML wrappers, independently inspect and retain the transformation and original manifest, then provide the verified `<arm>-runtime-provenance.json` separately.

For saved local build ZIPs, also supply `<arm>-artifact.json`:

```json
{
  "file": "/absolute/path/to/frozen-build.zip",
  "version": "13.49.0",
  "sha256": "trusted-sha256-of-the-zip"
}
```

Chrome manifest `13.49.0.0` uses expected artifact version `13.49.0`. Public artifact launch validates the archive hash/version and preserves the existing profile. Without this file, cold setup launches the checkout's existing dist. It never requests another build mode.

## Run the flows

From the checkout root, set `PERPS_MEASUREMENT_CONFIG` to the config path. If a task has a locked executable, set `MM_HARNESS_BIN` to that exact path. The cohort wrapper checks the configured harness version before runtime actions.

```sh
export PERPS_MEASUREMENT_CONFIG="$PWD/temp/perps-loading/config.json"
node development/perps/loading/run-loading-cohort.ts before immediate 1 3
node development/perps/loading/run-loading-cohort.ts before delayed 1 3
node development/perps/loading/run-loading-cohort.ts before warm 1 3
node development/perps/loading/run-loading-cohort.ts before background_resume 1 3
```

Each cold sample locks and stops the existing browser, verifies process/CDP termination, publicly launches the frozen artifact with the same profile, then runs `launch --verify`. Its recipe unlocks and clicks Perps immediately after Home appears, or three seconds after observed unlock for `delayed`. Timing excludes browser launch and verification. A fresh browser process does not imply a cold OS, DNS or backend cache.

Warm samples require a previously loaded session and reuse the process/document. Run a cold sample first to install the observer without reloading during warm measurements. Resume hides the page through one temporary blank tab, observes hidden then visible, and closes that tab. This measures a brief tab resume, not prolonged browser suspension or socket recovery.

Start account comparisons on the verified first account. Run one sample per genuine change, alternating targets:

```sh
node development/perps/loading/run-loading-cohort.ts before account 2 2 dev2
node development/perps/loading/run-loading-cohort.ts before account 3 3 dev1
node development/perps/loading/run-loading-cohort.ts before account 4 4 dev2
node development/perps/loading/run-loading-cohort.ts before account 5 5 dev1
node development/perps/loading/run-loading-cohort.ts before account 6 6 dev2
node development/perps/loading/run-loading-cohort.ts before account 7 7 dev1
```

The account journey returns Home, opens the account menu, clicks the target row, and then clicks Perps. It does not switch accounts inside an already-open Perps dashboard. The configured UI label must map to the verified internal account ID; UI labels can differ from account metadata names.

Repeat the identical cohorts using `after`, then leave the current PR build selected. Never use `--launch-existing-dist` with `mm-harness run`. Each run uses a new directory and stops at its first failure. Preserve failed attempts and diagnose them; do not overwrite them or silently replace them with passes.

## Summarize a declared cohort

Before collecting results, write `sample-manifest.json` in the evidence directory. Declare each arm/flow/direction, its verified source and collector hash, and at least three sample directories:

```json
{
  "cohorts": [
    {
      "arm": "before",
      "mode": "immediate",
      "sourceRef": "exact-baseline-commit",
      "buildProvenanceSha256": "sha256-of-JSON.stringify-of-verified-provenance",
      "collectorSha256": "sha256-of-JSON.stringify-of-ordered-collector-source-hashes",
      "formatterSha256": "sha256-of-shared/lib/perps-formatters.ts",
      "samples": [
        "before-immediate-1",
        "before-immediate-2",
        "before-immediate-3"
      ]
    }
  ]
}
```

Add the other cohorts and `accountName` for account flows. The collector hash covers the ordered `{ file, sha256 }` entries for `measure-loading.ts`, `market-observation.ts`, `browser-process.ts` and `run-loading-cohort.ts`, serialized with `JSON.stringify` without indentation. Hash the parsed provenance with `JSON.stringify`, without indentation, using the runtime provenance when present. Do not mix collector versions, formatter versions or build identities. Authoring probes belong outside the declared sample set.

```sh
node development/perps/loading/summarize-loading.ts temp/perps-loading/evidence
```

The summary recomputes durations from raw timestamps, verifies price/account assertions and recipe results, excludes failed attempts from successful statistics, and lists missing/excluded directories. Report median, range, count and every raw value. Three samples establish an observed median, not statistical significance or a percentile estimate.

SDK events stay in each sample's `measurements.json`. Pair `spanStart` and `spanEnd` by span ID, take duration from SDK timestamps, and use start-time scope context. Scope tags observed at span end may describe another operation. Filter successful spans separately from timeout, cancellation and error outcomes. Keep SDK durations separate from browser click-to-DOM durations.

The new tool writes `comparison.json`, which is the complete declared-cohort summary. The checked-in `docs/perps/loading-performance-results.json` is a sanitized extract of the earlier V2 benchmark: it retains raw timestamps, metrics, sample hashes and counts without wallet addresses or full SDK events. It is not the direct output schema of this summarizer. Its original V2 collector hash covers one file; version 3 hashes the four source files listed above and fixes complete-row readiness. Keep those versions separate.

`observation.unlock` is the unlock-submit click; `observation.unlocked` is the first frame observing an unlocked wallet. `unlockClickToEntryMs`, `unlockClickToDataMs` and `unlockClickToLiveMs` use the former; `observedUnlockToEntryMs` uses the latter. They are not interchangeable.
