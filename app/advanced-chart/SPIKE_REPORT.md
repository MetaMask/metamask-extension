# Spike: Advanced Charts (TradingView) on the Extension TDP — Report

> **Scope:** MINIMAL integration of the shared `@metamask/advanced-chart-core`
> engine into the browser extension's Token Details Page (TDP), reusing the same
> sandboxed-iframe + `postMessage` bridge model the design doc proposes.
> **Branch:** `feat/advanced-chart-tdp-minimal`. **Perps / lightweight-charts:
> untouched.**
>
> This is a **spike**. The MetaMask side — the sandboxed-iframe + `postMessage`
> bridge and the OHLCV data path — is **confirmed working end-to-end** (handshake
> completes, `SET_OHLCV_DATA {barCount: 337}` delivered). The chart still does
> **not** render: the proprietary TradingView `charting_library` binary WAS
> vendored and loaded, yet the TradingView widget throws an **opaque-origin
> `SecurityError`** inside its own code. The **hard blocker is the MV3
> manifest-`sandbox` opaque origin, not the binary** — see the reproduced error
> and verdict in [§10 FINAL VERDICT](#10-final-verdict-supersedes-45-optimism--extension-local-rendering-is-infeasible-on-mv3).

---

## 1. Files created / changed

### Pre-existing (verified, built upon — NOT recreated)

- `app/advanced-chart/chartLogic.iife.js` — shared engine IIFE (184 KB), vendored
  from mobile's `scripts/advanced-chart-webview/dist-core/chartLogic.iife.js`.
  This is **our** code, not the TradingView library.
- `app/advanced-chart/index.html` — the sandboxed bridge page. Defines the
  host↔engine `postMessage` protocol (channel `metamask-advanced-chart`).
- `app/advanced-chart/lib/README.md` — documents the TradingView-library blocker.

### Created in this spike

- **`ui/pages/asset/components/chart/advanced-asset-chart.tsx`** — the React
  **host** component. Renders the sandboxed iframe and implements the host side
  of the bridge (see §2). Accepts the OHLCV `bars` as a prop (fetched by the
  parent) — it no longer fetches internally. TypeScript, no `any`.
- **`ui/pages/asset/hooks/useOhlcvChartData.ts`** — the lifted OHLCV fetch hook.
  Mirrors mobile's `useOHLCVChart` return shape (`{ data, isLoading, error,
  hasEmptyData }`) and reuses the extension's data patterns (`@tanstack/react-query`
  like `useHistoricalPrices`, `toAssetId` from `shared/lib/asset-utils.ts`). Used
  by `asset-page.tsx` to drive the advanced-vs-legacy decision **before** picking
  a chart, and to hand the already-fetched bars to `AdvancedAssetChart`.
- **`app/advanced-chart/SPIKE_REPORT.md`** — this report.

### Changed in this spike

- **`development/webpack/webpack.config.ts`** — added a `CopyPlugin` pattern
  `{ from: join(context, 'advanced-chart'), to: 'advanced-chart' }` so the whole
  `app/advanced-chart/` tree (html + iife + `lib/`) is emitted to
  `dist/<browser>/advanced-chart/`. Follows the existing snaps/offscreen copy
  patterns. `context` is `app/`.
- **`app/manifest/v3/_base.json`**
  - Added `advanced-chart/index.html` to `sandbox.pages` (mirrors the existing
    `snaps/index.html` sandbox entry).
  - Added `web_accessible_resources` (MV3 form): `matches: ["<all_urls>"]`,
    `resources: ["advanced-chart/*"]`, so the unique-origin sandbox can load the
    engine + (future) library via `chrome-extension://…/advanced-chart/…`. The
    `ManifestPlugin` merges webpack's own `<all_urls>` resources into this entry.
- **`app/manifest/v3/chrome.json`** — minimal, **additive** relaxations to the
  **sandbox** CSP only (see §4 for the safety argument and the unverified part):
  - `style-src 'unsafe-inline'` (TradingView requires inline styles; nonce-based
    style-src is explicitly unsupported by the library).
  - `img-src 'self' data: blob:` (chart logos/emoji/blob images).
  - `worker-src blob:` (library web workers).
- **`ui/pages/asset/components/asset-page.tsx`**
  - Added `import AdvancedAssetChart from './chart/advanced-asset-chart';` and
    `import { useOhlcvChartData } from '../hooks/useOhlcvChartData';`.
  - **Replaced** the old static `const ENABLE_ADVANCED_CHART = false;` flag with a
    **data-driven SWAP** mirroring mobile (see §8): calls `useOhlcvChartData`
    once with the finalized `address`/`chainId`, then renders **either**
    `<AdvancedAssetChart symbol bars={ohlcvBars} />` **or** the legacy
    `<AssetChart />` — never both. The existing `asset-chart.tsx` line chart is
    **unchanged** and is the fallback.
  - Added `const OHLCV_MIN_BARS = 5;` (mirrors mobile's `CHART_DATA_THRESHOLD`).

### Library-vendoring wiring (added later — see §7)

- **`builds.yml`** — declared `ADVANCED_CHART_LIBRARY_URL` under `env` (default
  `https://charting-assets.static.metamask.io/tradingview/advanced-charts/v30.1.0/`),
  following the existing pattern for URL vars (e.g. `PORTFOLIO_URL`,
  `MM_BACKEND_WEBSOCKET_URL`). This is the **build-time source** to vendor the
  library from — **not** the runtime URL.
- **`.metamaskrc.dist`** — documented, commented `ADVANCED_CHART_LIBRARY_URL`
  override example.
- **`development/advanced-chart/fetch-library.mjs`** — opt-in vendoring script
  (see §7). Resolves the source URL from `process.env` → `.metamaskrc` → the
  builds.yml default, downloads the entry file(s), and crawls referenced
  chunks/assets to closure into `app/advanced-chart/lib/`.
- **`package.json`** — added `"advanced-chart:fetch-lib":
  "node ./development/advanced-chart/fetch-library.mjs"`.
- **`app/advanced-chart/lib/.gitignore`** — ignores everything under `lib/`
  except `README.md` and `.gitignore`, so the proprietary bundle can never be
  committed.
- **`app/advanced-chart/lib/README.md`** — updated to document the fetch script
  and the gitignore.
- The **runtime** `libraryUrl` in `advanced-asset-chart.tsx` is **unchanged** —
  it stays `browser.runtime.getURL('advanced-chart/lib/')` (extension-local
  `'self'` origin, required by the MV3 sandbox `script-src 'self'` CSP).

> The pre-existing untracked `.agents/` directory was left untouched.

---

## 2. How the bridge / data flow works

The engine was written for a React Native WebView: it posts out via
`window.ReactNativeWebView.postMessage(jsonString)` and only accepts inbound
messages whose origin is `''`/`null`/`file:`. `app/advanced-chart/index.html`
shims both sides so a normal extension host can drive it **without modifying the
shared engine**. The host side lives in `advanced-asset-chart.tsx`.

> **Confirmed live (Chrome):** this full sequence was reproduced end-to-end — the
> READY→CONFIG→`CHART_READY`→`SET_OHLCV_DATA` handshake completes (host accepts the
> sandbox's opaque `origin:'null'` READY via a source match and replies CONFIG with
> `targetOrigin:'*'`), the engine bundle loads, and `SET_OHLCV_DATA {barCount: 337}`
> is delivered. **The bridge is NOT the blocker** — the failure is downstream,
> inside the TradingView library (see §10).

Protocol (channel `metamask-advanced-chart`):

```
Host (React, advanced-asset-chart.tsx)        Sandbox (index.html + engine IIFE)
──────────────────────────────────────        ──────────────────────────────────
                                    <──  { direction:'fromEngine', ready:true }
{ direction:'toEngine', kind:'config',
  config:<window.CONFIG> }           ──>   sets window.CONFIG, loads engine IIFE
                                    <──  { direction:'fromEngine',
                                           data:'{"type":"CHART_READY"}' }
fetch OHLCV → 
{ direction:'toEngine', kind:'engineMessage',
  payload:{ type:'SET_OHLCV_DATA',
            payload:{ data:bars[] } } } ──>  engine renders series
                                    <──  { data:'{"type":"ERROR",...}' } on failure
```

Host-side sequence in `advanced-asset-chart.tsx`:

1. Renders `<iframe src={browser.runtime.getURL('advanced-chart/index.html')}
   sandbox="allow-scripts">` at a fixed height (default 360px).
2. Registers a `window` `message` listener filtered by `event.source ===
   iframe.contentWindow` **and** the channel/direction.
3. On `ready:true` → posts `kind:'config'` with `window.CONFIG` built from
   `@metamask/design-tokens` (`lightTheme`/`darkTheme`, selected via the
   extension `useTheme()` hook) and `libraryUrl =
   browser.runtime.getURL('advanced-chart/lib/')`. The config shape mirrors
   mobile's `createConfigScript()` (theme colors, `features`, `priceDecimals`,
   etc.), trimmed to what a minimal render needs. 9-char `#RRGGBBAA` tokens are
   stripped to `#RRGGBB` (TradingView expects 6-char hex).
4. On `CHART_READY` (parsed from the `fromEngine` data string) → posts the
   `bars` prop as a `SET_OHLCV_DATA` `engineMessage`. If the `bars` prop later
   changes while ready, the host re-sends it.
5. OHLCV data now flows **hook → parent → prop**: `useOhlcvChartData` (in
   `asset-page.tsx`) computes `assetId = toAssetId(address, chainId)` (CAIP-19,
   via `shared/lib/asset-utils.ts`) and fetches the same endpoint mobile uses —
   `https://price.api.cx.metamask.io/v3/ohlcv-chart/{assetId}?timePeriod=P1D` —
   mapping to the engine bar shape `{ time, open, high, low, close, volume }`
   (`time` = ms). The host **does not fetch**; it receives the bars via the
   `bars` prop (no double fetch).
6. `ERROR` engine messages are logged and swapped for a simple "Chart
   unavailable" fallback UI.

Data-flow note vs. the design doc: the doc proposes wiring OHLCV through
`@metamask/core-backend` `OHLCVService`. For this minimal spike the hook fetches
the same Price API endpoint directly (identical to mobile's `useOHLCVChart`),
which keeps the spike self-contained. Swapping in `OHLCVService` later is a
drop-in change inside `useOhlcvChartData` only.

---

## 3. Exact preview steps

1. **Supply the TradingView binary (required — see §4).** Drop the `v30.1.0`
   `charting_library/` bundle into `app/advanced-chart/lib/` so that
   `app/advanced-chart/lib/charting_library/charting_library.js` (+ chunks)
   exists. The CopyPlugin rule already copies the whole `advanced-chart/` tree.
   - The host sets `libraryUrl = runtime.getURL('advanced-chart/lib/')`, and the
     engine loads `${libraryUrl}charting_library.js`. If your bundle nests the
     file under `charting_library/`, either place the loader at
     `lib/charting_library.js` or adjust `libraryUrl` to
     `runtime.getURL('advanced-chart/lib/charting_library/')`.
2. **No flag to flip.** Selection is now automatic: open a token whose asset the
   OHLCV API supports (≥ `OHLCV_MIN_BARS` bars) and the Advanced Chart is chosen;
   unsupported/empty/errored assets keep the legacy line chart. See §8.
3. **Build/run the extension (webpack dev, no LavaMoat):**

   ```bash
   nvm use            # repo requires Node ^24.16.0
   yarn start         # === yarn webpack --watch, outputs dist/chrome
   ```

   (Use `yarn start:lavamoat` to sanity-check the LavaMoat path; `yarn dist`
   for a production zip. Neither is needed for a quick preview.)
4. **Load the unpacked extension** from `dist/chrome` in
   `chrome://extensions` (Developer mode → Load unpacked), open the wallet,
   navigate to any token's details page. The Advanced Chart renders in the
   sandboxed iframe directly beneath the existing line chart.

---

## 4. Blockers & exactly what's needed to unblock

> **⚠️ SUPERSEDED — see [§10 FINAL VERDICT](#10-final-verdict-supersedes-45-optimism--extension-local-rendering-is-infeasible-on-mv3).**
> This section was written **before** the render was actually performed. The
> render HAS since been performed against a real build: the binary was vendored
> and loaded successfully, so Blocker 1 is resolved — but the widget then failed
> on a **same-origin `SecurityError`**, not on any missing CSP directive (so the
> Blocker 2 "residual CSP risk" framing below is wrong). The real, irreducible
> blocker is the manifest-`sandbox` **opaque origin**. Read §10 for the reproduced
> error and the corrected conclusion; the notes below are kept only for history.

### BLOCKER 1 — TradingView `charting_library` binary (now vendorable via script)

- **Status:** largely **unblocked** for local/dev use. `yarn advanced-chart:fetch-lib`
  now vendors the `v30.1.0` bundle from the MetaMask CDN into
  `app/advanced-chart/lib/` (73 files, ~3.2 MB — see §7 for the exact listing and
  the closure/limitation analysis). The bundle stays git-ignored.
- **Runtime:** the library is served from the extension's own origin
  (`chrome-extension://…/advanced-chart/lib/…`), satisfying the sandbox
  `script-src 'self'` CSP. The `CopyPlugin` rule already emits the whole
  `advanced-chart/` tree, so vendored files ship in `dist/<browser>/`.
- **Remaining caveats:** only the `en` locale is vendored by default (configurable
  via `ADVANCED_CHART_LOCALES`); a real render was not performed here, so the
  end-to-end widget init is still unverified (also gated by the CSP caveat in
  Blocker 2). For a production distribution the canonical source is still the
  licensed TradingView package / a full mirror.
- **Behavior without vendoring:** the sandbox page loads, the engine boots, but
  `loadLibrary()` fails → the engine emits `ERROR` → the host shows "Chart
  unavailable". The bridge, config, and OHLCV fetch all still run.

### BLOCKER 2 — Sandbox CSP sufficiency (partially unverifiable without a build)

- I applied minimal **additive** relaxations to the **sandbox** CSP in
  `chrome.json` (`style-src 'unsafe-inline'`, `img-src 'self' data: blob:`,
  `worker-src blob:`). These are documented as required/likely-required by
  TradingView and the design doc.
- **Why this is safe for snaps** (the sandbox CSP is shared with
  `snaps/index.html`): CSP is deny-by-default per directive. The previous policy
  had `default-src 'none'` and no `style-src`/`img-src`/`worker-src`, so those
  resource types fell back to *blocked*. Adding those directives only **grants**
  capabilities; it cannot remove any capability snaps already had. So existing
  snaps behavior is unchanged.
- **What remains unverifiable without the binary + a full build:** whether
  TradingView needs *more* than the above — e.g. `frame-src`/`child-src` for its
  `sameorigin.html` (`iframe_loading_same_origin` featureset), or the
  `iframe_loading_compatibility_mode` fallback, or a `nonce`. `connect-src` is
  already `*`, so the OHLCV/price fetch is covered (tightening it is a
  follow-up). **TODO(blocker):** re-validate sandbox-CSP sufficiency once the
  library is present and the widget actually initializes.

### BLOCKER 3 — LavaMoat (expected clean, unverified here)

- No new npm dependency is imported into the UI bundle: the engine ships as a
  **static script inside the sandboxed iframe**, and the host component is
  ordinary UI code. Per the design doc this should **not** require LavaMoat
  policy regeneration. Not run here (no full build). **TODO(blocker):** confirm
  `yarn start:lavamoat` / `yarn build` builds cleanly and no policy diff is
  produced.

---

## 5. Honest render assessment

> **⚠️ SUPERSEDED — see [§10 FINAL VERDICT](#10-final-verdict-supersedes-45-optimism--extension-local-rendering-is-infeasible-on-mv3).**
> The "very likely renders once the binary is supplied" prediction below was
> **tested and proven wrong**. The binary was supplied and loaded, but the render
> **failed** — and it failed on a **same-origin `SecurityError`** thrown inside
> TradingView's code, **not** on a missing `frame-src`/`child-src` CSP directive
> as this section speculated. The residual risk was not CSP; it was the
> manifest-`sandbox` **opaque origin**, which cannot be undone. The rationale
> below is retained for history only.

**Will it render once the library binary is supplied?** ~~Very likely **yes**~~
**No** (see §10). The original rationale (retained for history):

- The engine is the exact same artifact mobile ships and boots identically; the
  only platform difference is the transport, and the sandbox shim already
  translates the RN bridge to iframe `postMessage` (verified by reading
  `index.html`).
- The host implements the same message sequence mobile's `AdvancedChart.tsx`
  uses for a first render (config → `CHART_READY` → `SET_OHLCV_DATA`), against
  the identical OHLCV endpoint and bar shape.
- ~~The realistic residual risk is **CSP** (Blocker 2): the first real render may
  surface a missing directive (most likely `frame-src`/`child-src` for
  `sameorigin.html`, or needing `iframe_loading_compatibility_mode`). That is a
  small, well-understood follow-up, not a redesign.~~ **Corrected (§10): the
  actual residual risk was NOT a missing CSP directive.** The first real render
  surfaced an uncaught same-origin `SecurityError` inside TradingView's library
  (opaque sandbox origin) — a redesign-level blocker, not a follow-up tweak.

Not implemented (out of minimal scope, intentionally): realtime candle updates,
pagination/scroll-back, indicators/MAs, time-range selector, `OHLCVService`
wiring, resize handling, and view/unit tests.

---

## 6. Sanity checks performed

- `advanced-asset-chart.tsx`, `asset-page.tsx`, and `webpack.config.ts` were
  checked with the editor's integrated diagnostics (TypeScript + configured
  linters) — **clean, no errors**.
- The standalone `eslint` CLI could not be run in this environment: the repo
  uses a legacy `.eslintrc.js` while `node_modules/eslint` is v9, and v9's
  eslintrc compatibility path throws a "circular structure" error during config
  schema validation (an environment/tooling mismatch, unrelated to the changed
  files). Per the spike guidance, a full `tsc --noEmit`/extension build was not
  run.

---

## 7. Library vendoring (`.metamaskrc` wiring + download attempt)

### How `.metamaskrc` config reaches the build

The webpack build (`development/webpack/utils/config.ts` → `loadConfigVars`)
merges variables in precedence order: `process.env` → `.metamaskprodrc` →
`.metamaskrc` → `builds.yml`'s `env:`. Values are JSON-stringified into
`safeVariables` and injected via the SWC loaders as `process.env.*`; an
`envValidationLoader` errors if bundled code reads a `process.env.X` **not**
declared in `builds.yml` (unused declarations are fine — the "unused var" check
is only a TODO in `builds.yml`).

### What was added

- `ADVANCED_CHART_LIBRARY_URL` declared in `builds.yml` `env:` (default the
  MetaMask CDN base for `v30.1.0`) and documented in `.metamaskrc.dist`. It is the
  **build-time source** the library is vendored from — deliberately **not** wired
  into runtime code (the runtime `libraryUrl` stays the extension-local
  `runtime.getURL('advanced-chart/lib/')`), so no `envValidationLoader` concern.
- `development/advanced-chart/fetch-library.mjs` + `yarn advanced-chart:fetch-lib`.
  Opt-in only (never part of the default build → CI/offline builds are unaffected).
  It resolves the source URL from `process.env` → `.metamaskrc` → the builds.yml
  default, fetches the entry file(s), and crawls their referenced chunks/assets to
  closure (verifying each URL returns 200). It expands the library's `__LANG__`
  locale-chunk placeholder to the configured locales (default `en`).

### `.gitignore` for `lib/`

`app/advanced-chart/lib/.gitignore` ignores `*` except `!.gitignore` and
`!README.md`, so the proprietary bundle is never committed.

### Download attempt — RESULT (honest)

`yarn advanced-chart:fetch-lib` against the `v30.1.0` CDN base succeeded with a
**complete static closure for the `en` locale: 73 files, ~3.2 MB, 0 fetch
failures.** Notable retrieved files:

| File | Bytes |
| --- | --- |
| `bundles/library.668013b6b41ce2feaa5c.js` | 2,481,955 |
| `bundles/en.938.5f20502c9172fdac1c7f.js` | 136,539 |
| `bundles/481.7c6283292170510c91f1.css` | 139,579 |
| `bundles/8971.352a74bc5eebf8040884.js` | 74,712 |
| `charting_library.js` / `charting_library.standalone.js` | 55,921 / 55,730 |
| `bundles/runtime.ddf792da21403fea7e07.js` | 25,974 |
| `bundles/EuclidCircular.be8f862db48c2976009f.woff2` | 35,044 |
| `bundles/dot.*.cur` / `bundles/eraser.*.cur` | 4,286 each |
| `bundles/performance.769cf9dda2ede7d12b74.svg` | 1,119 |
| `sameorigin.html` | 442 |
| + 60 more `bundles/en.<id>.<hash>.js` locale/feature chunks | — |

**Enumeration reality:** the CDN base returns **403 for directory listing** (S3
via CloudFront), and the localized chunks are published under a `__LANG__`
placeholder that does **not** exist as a literal URL — so a blind recursive
download is impossible. The script instead reaches closure by parsing the entry
files and following statically-written references (JS quoted chunk names resolved
against `publicPath`; CSS `url()` assets resolved against the CSS dir; `__LANG__`
expanded to `en`).

**What is / isn't complete:**

- ✅ Complete for a default (English) render: entry loaders, webpack runtime, the
  main `library.*.js`, the CSS + its font/cursor/svg assets, `sameorigin.html`,
  and all `en` locale/feature chunks referenced by the runtime chunk map.
- ⚠️ **Not** vendored: non-English locales (set `ADVANCED_CHART_LOCALES=en,de,…`
  to add them) and any asset whose URL the library builds purely at runtime from
  variables (none detected beyond the `__LANG__` chunk map, which we resolved).
- A **full multi-locale / guaranteed-complete** distribution still ideally comes
  from the licensed TradingView package or a full directory mirror, since the CDN
  can't be enumerated.

No full extension build was run to force-validate (per scope).

## 8. Data-driven chart selection (advanced ⇄ legacy) — mobile parity

The additive `ENABLE_ADVANCED_CHART` flag was replaced with mobile's actual
behavior: fetch OHLCV, and if data is available render the Advanced Chart,
otherwise fall back to the legacy `<AssetChart />`. It is a **SWAP** (advanced
**OR** legacy), never both.

### Mobile's decision logic (source of truth)

`app/components/UI/AssetOverview/Price/Price.advanced.tsx`:

```ts
const shouldFallbackToLegacy =
  !chartLoading &&
  (ohlcvData.length < CHART_DATA_THRESHOLD ||
    hasEmptyData ||
    chartError ||
    chartInitFailed === true);

// ...
if (shouldFallbackToLegacy) {
  return <PriceLegacy ... />;   // legacy line chart
}
return ( /* AdvancedChart ... */ );
```

with `CHART_DATA_THRESHOLD = 5`
(`.../Price/tokenOverviewChart.constants.ts`), and `useOHLCVChart` returning
`{ ohlcvData: OHLCVBar[]; isLoading; error: string | null; hasMore; nextCursor;
hasEmptyData }`, bar shape `{ time /* ms */, open, high, low, close, volume }`.

### Extension mirror

`asset-page.tsx`:

```ts
const { data: ohlcvBars, isLoading: isOhlcvLoading, error: ohlcvError } =
  useOhlcvChartData({ chainId, address });
const showAdvancedChart =
  !isOhlcvLoading && !ohlcvError && ohlcvBars.length >= OHLCV_MIN_BARS;
// render: showAdvancedChart ? <AdvancedAssetChart .../> : <AssetChart .../>
```

- **Data present (≥ 5 bars)** → Advanced Chart (bars passed as a prop).
- **Empty / < 5 bars** → legacy (covers mobile's `hasEmptyData` and the
  `length < CHART_DATA_THRESHOLD` branch).
- **Error** → legacy (mirrors `chartError`).
- **Loading** → legacy (see note below).

### Mobile conditions intentionally NOT ported

- **`chartInitFailed === true`** — mobile also falls back if the WebView engine
  fails to *initialize*. The extension host does surface an `ERROR`/"Chart
  unavailable" state, but that signal lives inside the sandboxed iframe and is
  **not** lifted to the parent decision (and the proprietary library isn't
  render-validated yet — the known separate blocker). So init-failure fallback
  is not wired into the swap. Follow-up: bubble the host `ERROR` up so the parent
  can swap back to legacy on init failure.
- **Loading behavior differs (documented divergence).** Mobile keeps the
  **advanced chart shell mounted with its own skeleton** during `chartLoading`
  (it does *not* show the legacy chart while loading). This spike instead shows
  the **legacy** chart during loading (`!isOhlcvLoading` is required for
  `showAdvancedChart`). This matches the task's stated goal ("still loading →
  legacy") and avoids mounting a blank/unvalidated advanced iframe with no data;
  it is a deliberate, minimal-scope divergence, not the WS/realtime/skeleton
  machinery mobile layers on top.
- **Feature flags / WS / indicators / time-range / realtime** — mobile's
  `Price.advanced.tsx` also gates on `selectTokenDetailsOhlcvWsEnabled`,
  `selectTokenDetailsTechnicalIndicatorsEnabled`, a `TimeRangeSelector`,
  realtime candles, pagination, and MAs. None of these affect the
  *OHLCV-availability* decision the user asked to mirror, so they are out of
  scope here (consistent with §5).

## 9. Commit status

Left **uncommitted** (clean working tree preferred for review). All code/wiring
files changed per §1 are unstaged; the vendored `app/advanced-chart/lib/` bundle
is git-ignored and confirmed excluded even from a broad `git add app/advanced-chart`
(only `SPIKE_REPORT.md`, `chartLogic.iife.js`, `index.html`, `lib/.gitignore`,
`lib/README.md` would stage). `.agents/` was not staged or touched.

---

## 10. FINAL VERDICT (supersedes §4/§5 optimism) — extension-local rendering is INFEASIBLE on MV3

After a full, code-verified feasibility investigation against a real build, the
honest conclusion is that **this TradingView build cannot be hosted
extension-locally on Chrome MV3.** The earlier "very likely renders once the
binary is supplied" assessment (§5) was wrong once the real CSP/origin behavior
was tested.

### Empirically reproduced (Chrome, live) — no longer a prediction

The MetaMask side ran cleanly (OHLCV fetch → HTTP 200, 337 bars; `asset-page`
rendered `<AdvancedAssetChart>`; the sandboxed iframe loaded; the postMessage
handshake completed; the engine bundle loaded; `SET_OHLCV_DATA {barCount: 337}`
was delivered). The render then broke with an **uncaught error thrown inside
TradingView's own library** — verbatim:

```
SecurityError: Failed to read a named property 'addEventListener' from 'Window':
Blocked a frame with origin "null" from accessing a cross-origin frame.
    at Be._innerWindowEvent (charting_library.js)
    at Be._create
    at new Be
    at createChartWidget (chartLogic.iife.js:4803)
```

The origin `"null"` is the manifest-`sandbox` **opaque origin** — the exact
same-origin break §5 dismissed as a minor CSP follow-up. It is not catchable or
configurable from our side; it is TradingView reaching for same-origin DOM access
that the opaque origin forbids.

**Corroborating block (independent, same root cause).** Chrome also blocked the
inner frame with:

```
Framing 'chrome-extension://<id>/' violates the following Content Security Policy
directive: "frame-ancestors 'none'". The request has been blocked.
```

**1. `'unsafe-eval'` is NOT the blocker (code-proven).** A no-ignore search of
the vendored `v30.1.0` build (all **67** JS files) found **0 `eval(`**, only
**dead / short-circuited `new Function`** (global-object detection idioms that
never execute in Chrome ≥ 123), and **0 WebAssembly**. The minimal candlestick
render works under **`script-src 'self'`** — no `'unsafe-eval'` required.

**2. The real, irreducible conflict is `'unsafe-inline'` vs. same-origin.**
TradingView delivers its **inner chart frame** (via the `blob:` /
`document.write` / `sameorigin.html` modes — all three) with **essential inline
`<script>` bootstrap blocks** (`__initialEnabledFeaturesets`, `JSServer`,
`urlParams`) read **synchronously** by the bundles, *and* it drives that inner
frame via **direct same-origin DOM access** (`_innerWindow().widgetReady()`,
`contentWindow.document.write`, `window.parent[uid]`, `frameElement.dataset`).
On any extension-**local** page these two needs are mutually exclusive:

- **Normal `extension_pages` page** = real `chrome-extension://` origin
  (same-origin DOM access works) **but** `extension_pages` **forbids
  `'unsafe-inline'`** (not relaxable) → the inner-frame bootstrap scripts are
  blocked.
- **Manifest `sandbox` page** = `'unsafe-inline'`/`'unsafe-eval'` allowed **but**
  an **opaque origin** (even `blob:` frames inherit the sandbox → fresh opaque
  origin), which breaks TradingView's same-origin DOM access.

**3. The only fix for the sandbox path — `allow-same-origin` — is FORBIDDEN in
the manifest `sandbox` CSP.** Adding it to `content_security_policy.sandbox`
makes Chrome's `csp_validator` **reject the manifest** verbatim — `Invalid value
for 'content_security_policy.sandbox'.` (deterministic; the pack step exits with
code 22). Chromium's `ContentSecurityPolicyIsSandboxed` returns **false** on that
token because `allow-same-origin` "negates the sandboxing", so the opaque origin
**cannot be undone** — a hard load failure. It has therefore been **removed** from
`chrome.json` (the sandbox flags
are just `sandbox allow-scripts`). No configuration reconciles the two needs —
not `iframe_loading_compatibility_mode` (its `about:blank` + `document.write` is
itself same-origin access), not disabling `iframe_loading_same_origin` (the
`blob:` path is opaque too), not a `nonce`.

> **Conclusion:** hosting this TradingView build **extension-locally** on Chrome
> MV3 is **infeasible**. The `'unsafe-inline'` inner-frame bootstrap and the
> same-origin DOM access cannot both be satisfied on one extension-local page.

### Recommended path forward (mobile model, gated on security review)

Host the full chart page (engine + TradingView library) on a **MetaMask-owned
remote web origin** — the same version-pinned
`https://charting-assets.static.metamask.io/tradingview/advanced-charts/v30.1.0/`
base mobile's `libraryUrl` already uses — and embed it in the extension via a
**non-extension (cross-origin) iframe**, driven over the existing `postMessage`
bridge. That origin has a real, stable origin (same-origin inner-frame access
works) and its **own** response CSP can grant `'unsafe-inline'`. This is a
deliberate **remote-code** decision and must be **gated on the security review**:
postMessage-only contract, **no `chrome.*`/keyring exposure** to the frame,
`extension_pages` `frame-src`/`connect-src` tightened to the owned origin, and the
origin owned + version-pinned.

**Alternatives:** (b) a **TradingView vendor build that externalizes the
inner-frame bootstrap** to `<script src>` (would let a normal `extension_pages`
page host it under `script-src 'self'`) — uncertain availability/licensing;
(c) **defer** the extension integration until (a) or (b) is resolved.

### What stays valid from this spike

The bridge/host wiring (§2), the data-driven advanced⇄legacy swap (§8), the
`useOhlcvChartData` hook, the `connect-src`-tightened + origin-allowlisted
`postMessage` hardening, and the verbatim `@metamask/advanced-chart-core` engine
all carry over to the remote-origin model. The `timePeriod` short-code fix
(`1d`, not `P1D`) is also independent of hosting and remains correct.
