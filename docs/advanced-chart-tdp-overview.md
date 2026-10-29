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

### 2.2 How mobile integrates AC

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
`<meta http-equiv="Content-Security-Policy">` that opens **both** `style-src
'unsafe-inline'` and `script-src 'unsafe-inline'`, each scoped to the
charting-library origin) and a **normal origin** (the WebView `source` sets
`baseUrl` to the library origin). That satisfies the requirements TradingView's
docs actually state (detailed with citations in §3): (a) **`style-src
'unsafe-inline'`**, which TradingView says a nonce **cannot** replace; (b) the
library **injects `<script>`/`<style>` elements inside its own iframe** at
runtime, so on the pinned v30.1.0 build it also needs `script-src
'unsafe-inline'`; and (c) TradingView's default **same-origin hosting**
expectation, which the WebView's real origin lets the inner chart frame satisfy.

### 2.3 The wall we hit in the extension (the core of the doc)

A browser extension has no WebView; the only embedding primitive is an
`<iframe>`, which inherits the extension's strict MV3 CSP. To see why this is a
wall, it is important to separate **what TradingView documents** (platform-
agnostic) from **what we infer about Chrome MV3** (our reasoning about platform
behavior — TradingView's docs never address MV3).

**Documented by TradingView:**

- **`style-src 'unsafe-inline'` is required**, and TradingView states a nonce
  **cannot** replace it — "Strict nonce-based `style-src` CSP is not currently
  supported; library styles still require `style-src 'unsafe-inline'`."
  ([ChartingLibraryWidgetOptions](https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.ChartingLibraryWidgetOptions/),
  [Release Notes](https://www.tradingview.com/charting-library-docs/latest/releases/release-notes/))
- The library **creates `<script>`/`<style>` elements inside its own iframe** at
  runtime, and its compatibility mode `document.write`s into that inner frame.
  ([Troubleshooting](https://www.tradingview.com/charting-library-docs/latest/troubleshooting/))
  Before v31.1.0 this also forces `script-src 'unsafe-inline'`; v31.1.0+ can
  satisfy the **scripts** with a `nonce`, but the **styles** still cannot be
  nonced.
- **Same-origin is the default hosting expectation** — "By default, the library
  expects its static files to be hosted on the same origin (domain) as the page
  that contains the chart"
  ([Hosting Library Cross-Origin](https://www.tradingview.com/charting-library-docs/latest/configuration/Hosting-Library-Cross-Origin/))
  — and there is an `iframe_loading_same_origin` featureset "when the iframe
  content must be served from the same origin" (v28+)
  ([Featuresets](https://www.tradingview.com/charting-library-docs/latest/customization/Featuresets)).
- TradingView's docs **never mention** MV3, `chrome-extension://`, sandboxed
  extension pages, or opaque origins, and state **no `eval` / `unsafe-eval`
  requirement** anywhere.

**Our Chrome-MV3 inference (platform behavior, not TradingView):**

- A normal MV3 page's `extension_pages` CSP **cannot grant `'unsafe-inline'`**, so
  to run the library's runtime-injected inline scripts/styles we would be forced
  onto a **sandboxed** extension page.
- A sandboxed extension page has an **opaque `"null"` origin**.
- That opaque origin is what **breaks TradingView's documented same-origin
  inner-frame DOM access**, surfacing at runtime as a `SecurityError` (the throw
  is observed originating from inside `charting_library.min.js` itself —
  third-party corroboration in
  [flutter/flutter#52367](https://github.com/flutter/flutter/issues/52367)). So
  the two are **mutually exclusive** on any **extension-local** page:

| Extension-local host | Inline scripts/styles allowed | Same-origin inner-frame DOM | Verdict |
| --- | --- | --- | --- |
| **Normal page** (`extension_pages`) | ❌ blocked — CSP forbids `'unsafe-inline'` (not relaxable) | ✅ real `chrome-extension://` origin | ❌ |
| **Sandboxed page** (`sandbox`) | ✅ `'unsafe-inline'` allowed | ❌ opaque `"null"` origin; `allow-same-origin` **forbidden** in the manifest `sandbox` CSP field | ❌ |

- **`'unsafe-eval'` is NOT the blocker** (nor is it a TradingView requirement).
  The vendored `v30.1.0` build renders a minimal candlestick chart under
  `script-src 'self'` (no `eval`, no live `new Function`, no WebAssembly per the
  spike audit). The real conflict is **inline scripts/styles vs. same-origin
  inner-frame DOM access**.
- The only fix for the sandbox path — adding `allow-same-origin` to
  `content_security_policy.sandbox` — makes Chrome **reject the manifest** (hard
  load failure), so it is not an option.

**Two accuracy caveats:**

- **`iframe_loading_compatibility_mode` does NOT solve this.** It only swaps
  `blob:` for `about:blank` + `document.write`, but `document.write` into the
  inner frame is **still a same-origin operation**, so it cannot render under an
  opaque origin. TradingView staff confirm it is aimed at strict-CSP **wallet
  browsers that still have a real origin** (added v24.001).
  ([charting-library-examples#338](https://github.com/tradingview/charting-library-examples/issues/338),
  [FAQ](https://www.tradingview.com/charting-library-docs/latest/getting_started/Frequently-Asked-Questions/))
- **Cross-origin (CORS) hosting only covers fetching the static files, not
  DOM/iframe access** — so it does not rescue the same-origin inner-frame
  requirement.
  ([Hosting Library Cross-Origin](https://www.tradingview.com/charting-library-docs/latest/configuration/Hosting-Library-Cross-Origin/))

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

---

### Source references

- Extension current chart: `ui/pages/asset/components/chart/asset-chart.tsx`,
  `ui/pages/asset/hooks/useHistoricalPrices.ts`, `ui/pages/asset/util.ts`
- Extension MV3 CSP: `app/manifest/v3/chrome.json`
- Extension spike + full verdict: `app/advanced-chart/SPIKE_REPORT.md`
- Mobile AC integration (metamask-mobile):
  `app/components/UI/Charts/AdvancedChart/AdvancedChartTemplate.ts`,
  `.../webview/chartLogicString.ts`, `.../useOHLCVChart.ts`,
  and `docs/advanced-chart-core-migration.md`
- TradingView / platform docs (external — support the CSP, same-origin, and
  compatibility-mode claims above):
  - `style-src 'unsafe-inline'` requirement (nonce not supported):
    [ChartingLibraryWidgetOptions](https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.ChartingLibraryWidgetOptions/),
    [Release Notes](https://www.tradingview.com/charting-library-docs/latest/releases/release-notes/)
  - Same-origin default hosting + CORS covers static files only:
    [Hosting Library Cross-Origin](https://www.tradingview.com/charting-library-docs/latest/configuration/Hosting-Library-Cross-Origin/)
  - `iframe_loading_same_origin` featureset (v28+):
    [Featuresets](https://www.tradingview.com/charting-library-docs/latest/customization/Featuresets)
  - Runtime-injected `<script>`/`<style>` + compatibility-mode `document.write`:
    [Troubleshooting](https://www.tradingview.com/charting-library-docs/latest/troubleshooting/),
    [FAQ](https://www.tradingview.com/charting-library-docs/latest/getting_started/Frequently-Asked-Questions/)
  - `iframe_loading_compatibility_mode` is for real-origin wallet browsers
    (staff, v24.001):
    [charting-library-examples#338](https://github.com/tradingview/charting-library-examples/issues/338)
  - `SecurityError`/opaque-`null`-origin throw originates in
    `charting_library.min.js` (third-party corroboration):
    [flutter/flutter#52367](https://github.com/flutter/flutter/issues/52367)

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
- For strict-CSP environments **that still have a real origin** (e.g. some wallet
  browsers), TradingView points to the `iframe_loading_compatibility_mode`
  featureset. Note this **does not help the extension's opaque-origin case** — it
  swaps `blob:` for `about:blank` + `document.write`, and that `document.write`
  is still a same-origin operation (see §2.3).
  ([Troubleshooting](https://www.tradingview.com/charting-library-docs/latest/troubleshooting/),
  [FAQ](https://www.tradingview.com/charting-library-docs/latest/getting_started/Frequently-Asked-Questions/),
  [charting-library-examples#338](https://github.com/tradingview/charting-library-examples/issues/338))

### Why this does NOT rescue the extension

MV3's `extension_pages` CSP only permits `'self'` / `'wasm-unsafe-eval'` / `'none'`
for `script-src` — it allows **neither `'unsafe-inline'` nor nonces/hashes**. So
even TradingView's **v31.1.0 nonce** support **can't be used** on a normal
extension page, and the sandboxed-page route still fails on the same-origin
requirement (`allow-same-origin` forbidden in the manifest `sandbox` CSP). **The
extension wall from §2 stands** — remote-hosting on a MetaMask-owned origin
remains the leading **option to try (untested)**.

---

## 4. Policy & store-compliance alignment

**Question:** is the recommended path — serving the TradingView Advanced Charts
library + the chart page from a **MetaMask-owned web origin**, embedded in a
**cross-origin `iframe`** and talking over **`postMessage`** — aligned with
TradingView licensing and browser-extension **store policies**?

**Net verdict:** **This path is policy-sanctioned, not a workaround.** Chrome MV3
**explicitly exempts** isolated iframe contexts from the remote-code ban,
self-hosting the library from a MetaMask-owned origin is **TradingView's intended
model**, and Firefox AMO's same-origin carve-out **covers it** (with a pre-review).
The **only** genuine open item is a single TradingView account-manager
confirmation that browser-extension use counts as a **"public" implementation**.
Everything else is standard store-review execution. **Ship it once TradingView
signs off.**

### 4.1 TradingView Advanced Charts — conditionally aligned

- **Self-hosting from a MetaMask origin is the intended model.** Serving the
  library from an origin you own (e.g.
  `charting-assets.static.metamask.io`) IS the documented "self-host" pattern.
  ([Getting started](https://www.tradingview.com/charting-library-docs/latest/getting_started/),
  [FAQ](https://www.tradingview.com/charting-library-docs/latest/getting_started/Frequently-Asked-Questions/),
  [Free Charting Library](https://www.tradingview.com/free-charting-libraries/))
- **Genuine ambiguity:** the free tier requires a **"public" (non-paywalled)
  implementation**, and TradingView's public docs do **not** explicitly address
  **browser-extension** use. This needs confirmation from a TradingView
  **account manager** / a **signed Free Advanced Charts Agreement**.

### 4.2 Chrome Web Store / MV3 — explicitly permitted (nuanced)

This is the key result. Google's MV3 program policy **explicitly exempts isolated
contexts** from the remote-code ban:

> "code run in contexts that are isolated from extension APIs (such as iframes and
> sandboxed pages) are exempt from the restriction on loading code from remote
> sources; however ... it must still be possible to determine the full
> functionality of your extension and the interaction must still comply with our
> user data policies, including Limited Use and the extension's Privacy Policy."
> — [MV3 Program Policies](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements)

- So a cross-origin `<iframe>` on a real `https://` origin, **isolated from
  `chrome.*` APIs**, communicating only via `postMessage`, is **allowed remote
  content** — **not** prohibited remote-hosted *code*.
  ([Deal with remote hosted code violations](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code),
  [Improve extension security](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security))
- **Conditions:**
  - Full functionality must stay **discernible at review**.
  - Add the MetaMask origin to **`frame-src`** (and **`connect-src`** if the
    extension fetches from it).
  - Keep the `extension_pages` CSP within **`self` / `none` / `wasm-unsafe-eval`**.
  - Update the **Privacy Policy / Limited-Use disclosures** to cover data sent to
    `*.metamask.io`.
  - A first-party origin **isn't required**, but is **lower review-risk**.

### 4.3 Firefox AMO — likely allowed, stricter / less explicit

- AMO's headline rule **bans remote code**, but a policy **footnote** permits
  remote code executed "in documents with the **same origin as the code being
  executed**, or, under limited circumstances, in carefully constructed
  sandboxes" and **never** "in privileged contexts." The remote chart page runs
  **same-origin-to-itself** in a **non-privileged web context**, which fits.
  ([Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/),
  [Build a secure extension](https://extensionworkshop.com/documentation/develop/build-a-secure-extension/))
- Because the carve-out is **footnote-level** and AMO **reviews manually**, treat
  AMO as the **higher review-risk** store and get a **pre-review**. The
  extension's own CSP must **not** be loosened.

### 4.4 Security team review

Engage **MetaMask's internal Security team** in **two ordered steps** — verify the
problem and hunt for a simpler fix first; only if none exists, pressure-test the
proposed remote-origin design:

1. **First — verify the problem + look for a simpler workaround.** Have Security
   review/verify the core issue (the **MV3 CSP wall** — that an extension-local
   page can't satisfy TradingView's documented **`style-src 'unsafe-inline'`**
   (plus its runtime-injected inline scripts/styles) *and* the **same-origin
   inner-frame DOM access** at once) and explore whether there's an
   **easier/simpler workaround** we've missed, **before** committing to a bigger
   solution.
2. **Then — if there's no simpler workaround, validate the suggested path.** Have
   Security confirm that the proposed direction (remote **MetaMask-owned chart
   origin** + cross-origin `<iframe>` + `postMessage`) actually **makes sense and
   is feasible/sound**.

Finally, obtain **Security team sign-off before Chrome / Firefox store
submission**.
