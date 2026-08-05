# Advanced Charts on the TDP — Overview

> **What this is:** a short explainer of today's TDP (Token Details Page) chart in
> the extension, the goal of moving it to TradingView Advanced Charts (AC), and
> the concrete MV3 wall that makes hosting AC on an extension-local page
> infeasible. This is an explainer, not a design doc.

---

## 1. Current TDP chart (extension)

- **Library:** **Chart.js v4 + react-chartjs-2** (`chart.js` `^4.4.1`,
  `react-chartjs-2` `^5.2.0` in `package.json`). It renders a **filled line/area
  chart** on an HTML5 `<canvas>` (`fill: true`, gradient `backgroundColor`).
- **Component:** `AssetChart` in
  `ui/pages/asset/components/chart/asset-chart.tsx`. It uses the `<Line>` element,
  a decimation plugin (LTTB, 150 samples), and a custom crosshair plugin.
- **Data:** `useHistoricalPrices` (`ui/pages/asset/hooks/useHistoricalPrices.ts`)
  fetches the Price API **`/v3/historical-prices/{chainId}/{assetType}`** endpoint
  via `@tanstack/react-query`. Time ranges come from `TIME_RANGES`
  (`P1D`/`P1W`/`P1M`/`P3M`/`P1Y`/`P1000Y`) mapped to Price API time periods in
  `ui/pages/asset/util.ts` (`1D` / `7D` / `1M` / `3M` / `1Y` / `1000Y`), surfaced
  as the **1D / 1W / 1M / 3M / 1Y / All** buttons.

**The one thing that matters for the challenge:** the chart is **plain bundled
JavaScript** running directly inside the normal extension UI. **No iframe, no
sandbox, no inline `<script>`, no remote code.** It renders under the MV3
`extension_pages` CSP — `script-src 'self' 'wasm-unsafe-eval'` (no
`'unsafe-inline'`, no remote origins) in `app/manifest/v3/chrome.json`. That
strict CSP/hosting profile is exactly why Chart.js fits with **zero
relaxations**.

---

## 2. Goal: integrate TradingView Advanced Charts (AC) in TDP

### 2.1 Goal

Replace the TDP chart with **TradingView Advanced Charts** — the *same* engine
mobile already ships, shared through the **`@metamask/advanced-chart-core`**
package. This is the strategic single-engine direction (Perps is expected to
migrate to AC later too), so both clients consume one implementation instead of
maintaining separate charts.

### 2.2 How mobile integrates AC (briefly)

On mobile a React Native **`WebView`** loads an HTML template
(`app/components/UI/Charts/AdvancedChart/AdvancedChartTemplate.ts`) that boots the
shared engine (stringified bundle in
`app/components/UI/Charts/AdvancedChart/webview/chartLogicString.ts`, auto-generated
from `@metamask/advanced-chart-core`). The engine creates the TradingView widget
and talks to the RN host over a **`postMessage` bridge**
(`window.ReactNativeWebView.postMessage(...)` out; `SET_OHLCV_DATA`,
`REALTIME_UPDATE`, etc. in). OHLCV data comes from the Price API
`/v3/ohlcv-chart/{assetId}` (`useOHLCVChart.ts`). The proprietary TradingView
library is self-hosted from a MetaMask CDN via `MM_CHARTING_LIBRARY_URL`
(default `https://charting-assets.static.metamask.io/tradingview/advanced-charts/v30.1.0/`
in `builds.yml`; declared in `.js.env.example`).

**Why it works on mobile:** the WebView document has its **own CSP** (a
`<meta http-equiv="Content-Security-Policy">` that allows `script-src
'unsafe-inline'`) and a **normal origin** (the WebView `source` sets `baseUrl` to
the library origin). So TradingView's two hard requirements are both satisfied:
(a) the **inline `<script>` bootstrap** in its inner chart frame, and (b)
**same-origin DOM access** to that inner frame.

### 2.3 The wall we hit in the extension (the core of the doc)

A browser extension has no WebView; the only embedding primitive is an
`<iframe>`, which inherits the extension's strict MV3 CSP. TradingView's two
requirements are **mutually exclusive** on any **extension-local** page:

| Extension-local host | Inline `<script>` bootstrap | Same-origin DOM access | Verdict |
| --- | --- | --- | --- |
| **Normal page** (`extension_pages`) | ❌ blocked — CSP forbids `'unsafe-inline'` (not relaxable) | ✅ real `chrome-extension://` origin | ❌ |
| **Sandboxed page** (`sandbox`) | ✅ `'unsafe-inline'` allowed | ❌ opaque origin; `allow-same-origin` **forbidden** in the manifest `sandbox` CSP field | ❌ |

- **`'unsafe-eval'` is NOT the blocker.** The vendored `v30.1.0` build renders a
  minimal candlestick chart under `script-src 'self'` (no `eval`, no live
  `new Function`, no WebAssembly per the spike audit). The real conflict is the
  **`'unsafe-inline'` inner-frame bootstrap vs. same-origin DOM access**.
- The only fix for the sandbox path — adding `allow-same-origin` to
  `content_security_policy.sandbox` — makes Chrome **reject the manifest** (hard
  load failure), so it is not an option.

**Conclusion (proven):** hosting the TradingView Advanced Charts build on an
**extension-local page is infeasible on Chrome MV3.**

**Option to try (untested):** host the AC page on a **MetaMask-owned remote web
origin** (mirroring mobile, version-pinned to the same
`charting-assets.static.metamask.io/…/v30.1.0/` source) and embed it via a
cross-origin `iframe` + `postMessage`. That origin would have its own CSP (can
grant `'unsafe-inline'`) and a real origin (same-origin inner frame works), so it
*should* clear both walls — **but this follows from the constraints above and has
not been validated yet.** It is also a deliberate **remote-code** decision that
must be **gated on security review** — a candidate direction, not a full design.
See [Can we verify this locally?](#4-can-we-verify-this-locally) for how to test
the mechanism before any deploy.

---

### Source references (jump points)

- Extension current chart: `ui/pages/asset/components/chart/asset-chart.tsx`,
  `ui/pages/asset/hooks/useHistoricalPrices.ts`, `ui/pages/asset/util.ts`
- Extension MV3 CSP: `app/manifest/v3/chrome.json`
- Extension spike + full verdict: `app/advanced-chart/SPIKE_REPORT.md`
- Mobile AC integration (metamask-mobile):
  `app/components/UI/Charts/AdvancedChart/AdvancedChartTemplate.ts`,
  `.../webview/chartLogicString.ts`, `.../useOHLCVChart.ts`,
  and `docs/advanced-chart-core-migration.md`

> **Verified:** all file paths, imports, dependency versions, the two CSP strings,
> and the spike verdict above were confirmed against both repos.

---

## 3. CSP & `unsafe-inline` — mobile vs extension

### Mobile's WebView CSP (what it uses)

The mobile WebView document sets its own `<meta http-equiv="Content-Security-Policy">`
in `app/components/UI/Charts/AdvancedChart/AdvancedChartTemplate.ts` (~L179). It
opens **both** inline directives — `script-src 'unsafe-inline'` and
`style-src 'unsafe-inline'` (each also scoped to the charting-library origin) —
but keeps everything else tight:

- `connect-src https://price.api.cx.metamask.io`
- `worker-src blob:`
- `frame-src 'self' blob: <lib-origin>`
- `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`

### Is `script-src 'unsafe-inline'` safe there?

- It's a **deliberate, bounded relaxation** — acceptable in this context, but the
  loosest directive in the policy.
- `'unsafe-inline'` in principle **disables CSP's main XSS protection** (any inline
  script can run); the real risk depends on whether attacker markup can enter the
  document.
- Mobile **contains** that risk: an **isolated WebView** with **no keyring/wallet
  access**, loading a MetaMask-controlled HTML template + a **self-hosted,
  version-pinned** TradingView library from a MetaMask origin (no third-party/user
  HTML). `connect-src` is locked to the price API (throttles exfil), and
  `object-src`/`base-uri`/`frame-ancestors` are locked.
- **The invariant that must hold:** every value interpolated into the inline
  `<script>`/config (theme colors, feature config, OHLCV/data) **must be safely
  encoded** (`JSON.stringify` / validated). Data over `postMessage` is data (safe);
  the risk is any **raw string concatenated into the inline config** — with
  `'unsafe-inline'`, an unsanitized template injection would become **script
  execution** inside the WebView.

### What the official TradingView docs say

- **`style-src 'unsafe-inline'` is genuinely required** — strict nonce-based
  `style-src` is **not** supported; library styles always need
  `style-src 'unsafe-inline'`.
  ([ChartingLibraryWidgetOptions › nonce](https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.ChartingLibraryWidgetOptions/))
- **`script-src 'unsafe-inline'` is avoidable only from v31.1.0**, which added a
  CSP **`nonce`** widget option (applies a nonce to TradingView's bootstrap
  scripts, enabling strict nonce-based `script-src`; falls back to
  `window.__tvCspNonce` or a host `<script nonce>`).
  ([Release Notes v31.1.0](https://www.tradingview.com/charting-library-docs/latest/releases/release-notes))
- **Mobile is pinned to v30.1.0** (`…/tradingview/advanced-charts/v30.1.0/` in
  `builds.yml`), which **predates** nonce support — so for mobile today
  `script-src 'unsafe-inline'` is effectively required. Upgrading to **≥ v31.1.0**
  would let mobile switch `script-src` to a nonce and drop `'unsafe-inline'` for
  scripts (styles still need `'unsafe-inline'`). This is a **possible future
  tightening, not a current action**.
- For environments where CSP can't be adjusted, TradingView points to the
  `iframe_loading_compatibility_mode` featureset.
  ([Troubleshooting](https://www.tradingview.com/charting-library-docs/latest/troubleshooting/))

### Why this does NOT rescue the extension

MV3's `extension_pages` CSP only permits `'self'` / `'wasm-unsafe-eval'` / `'none'`
for `script-src` — it allows **neither `'unsafe-inline'` nor nonces/hashes**. So
even TradingView's **v31.1.0 nonce** support **can't be used** on a normal
extension page, and the sandboxed-page route still fails on the same-origin
requirement (`allow-same-origin` forbidden in the manifest `sandbox` CSP). **The
extension wall from §2 stands** — remote-hosting on a MetaMask-owned origin
remains the leading **option to try (untested)**.

---

## 4. Can we verify this locally?

**Yes** — the remote-hosting option can be validated locally before any real
deploy. The point is to prove the **mechanism**: a real (non-extension) web origin
clears both walls at once.

1. **Serve the AC page from a local static web server** (e.g.
   `http://localhost:8080`): the sandbox `index.html` + the
   `@metamask/advanced-chart-core` engine bundle + the vendored TradingView lib. A
   plain static server sends no/permissive CSP, so the inner-frame **inline
   bootstrap scripts run** *and* the inner frame is **same-origin** — both walls
   disappear, because `localhost` is a **real web origin**, not an extension page.
2. **Point the extension's chart `<iframe src>`** at the `http://localhost:8080/…`
   URL instead of the `chrome-extension://…/advanced-chart/index.html` page.
3. **Allow that origin in the manifest `extension_pages` CSP:** add
   `frame-src http://localhost:8080` (and `connect-src` if the page fetches
   directly). MV3 **allows** extension pages to embed **remote iframes** via
   `frame-src` — only remote *scripts* are forbidden — so this is permitted.
4. **Rebuild and open the SOL TDP.** Success = the candlestick chart renders from
   the localhost origin and the `postMessage` bridge works.

### Caveat — local success ≠ ship-ready

Localhost proves the **mechanism only**. Production still needs **HTTPS** + a
**MetaMask-owned, version-pinned** origin, the manifest `frame-src`/`connect-src`
pointed at that origin, and the **security review** for remote code. A passing
local test does not make it shippable.
