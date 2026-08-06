# TradingView `charting_library` — self-hosted asset (REQUIRED, NOT COMMITTED)

This directory must contain the proprietary TradingView **Advanced Charts**
(`charting_library`) static assets before the Advanced Chart can render. They are
intentionally **not** committed here (and are git-ignored — see below) because:

- The library is **proprietary / license-restricted** — it must not be committed
  to source control.
- It is a large binary bundle that should not be pulled in speculatively.

## How to vendor it (build-time, opt-in)

Run the fetch script, which downloads the library from `ADVANCED_CHART_LIBRARY_URL`
(defaults to the MetaMask-hosted CDN base for `v30.1.0`, the version mobile pins)
into this directory:

```bash
yarn advanced-chart:fetch-lib
```

- Source URL: `ADVANCED_CHART_LIBRARY_URL` (set in `builds.yml`, overridable in
  `.metamaskrc`). This is the **build-time source**, NOT the runtime URL.
- Script: `development/advanced-chart/fetch-library.mjs`. It fetches the entry
  file(s), then crawls their referenced chunks/assets to closure (the CDN blocks
  directory listing, so a blind recursive download is impossible). Localized
  chunks use a `__LANG__` placeholder; the script vendors English (`en`) by
  default — override with `ADVANCED_CHART_LOCALES=en,de,fr`.

> **⚠️ Testing / spike only.** This fetch script exists **only** to reproduce the
> extension-local hosting spike (self-hosting the library from `'self'`), which
> the spike found **infeasible** on MV3 — see the "vendoring does NOT unblock"
> update below and `app/advanced-chart/SPIKE_REPORT.md` §10. Production would use
> the recommended remote-origin design (library served from a MetaMask-owned web
> origin, loaded at runtime like mobile's `MM_CHARTING_LIBRARY_URL`), which
> vendors nothing into the extension.

## .gitignore

Everything under this directory is ignored (`app/advanced-chart/lib/.gitignore`)
**except** `README.md` and `.gitignore` itself, so the vendored proprietary
bundle can never be accidentally committed.

## What the engine loads

The shared engine (`@metamask/advanced-chart-core`) loads the library at runtime
from `window.CONFIG.libraryUrl`:

```
<script src="{libraryUrl}charting_library.js"></script>
```

and passes `library_path: libraryUrl` to the TradingView widget constructor, so
the library then resolves its own hashed chunks / fonts / `sameorigin.html`
relative to that base URL.

## Where mobile gets it

Mobile does **not** vendor the library either — it points `libraryUrl` at a
MetaMask-owned CDN (from `builds.yml`):

```
https://charting-assets.static.metamask.io/tradingview/advanced-charts/v30.1.0/
```

That origin serves `charting_library.js` + all chunks.

## How to unblock this extension integration

Under the MV3 `sandbox` CSP the sandboxed iframe uses `script-src 'self'`, so a
remote `<script src="https://charting-assets…">` is **blocked**. The library
must therefore be **self-hosted inside the extension package** and loaded from a
`chrome-extension://` (`'self'`) URL.

1. Obtain the `v30.1.0` `charting_library/` bundle (same version mobile pins),
   e.g. mirror it from the MetaMask CDN above or from TradingView directly.
2. Drop its contents into this directory so the build output looks like:
   `dist/<browser>/advanced-chart/lib/charting_library.js` (+ chunks).
   The CopyPlugin entry in `development/webpack/webpack.config.ts` already copies
   the whole `app/advanced-chart/` tree, so files placed here are picked up.
3. The host component (`ui/pages/asset/components/chart/advanced-asset-chart.tsx`)
   already sets `libraryUrl` to `chrome.runtime.getURL('advanced-chart/lib/')`.

Until step 1–2 are done the sandbox page loads and the engine boots, but the
widget cannot initialize (the engine will emit an `ERROR` when the library
fails to load).

> **UPDATE — vendoring does NOT unblock extension-local rendering.** The steps
> above were completed: the `v30.1.0` library was successfully vendored into this
> directory and loaded from the `chrome-extension://…/advanced-chart/lib/`
> (`'self'`) URL. The widget **still** fails — not because the library is missing,
> but because it throws an uncaught opaque-origin `SecurityError` (`Blocked a frame
> with origin "null" from accessing a cross-origin frame` at `createChartWidget`),
> corroborated by a `frame-ancestors 'none'` framing block. The MV3
> manifest-`sandbox` opaque origin is the real, irreducible blocker, so
> **extension-local hosting is infeasible on MV3** regardless of vendoring — see
> `app/advanced-chart/SPIKE_REPORT.md` §10. Self-hosting the library from `'self'`
> is only relevant to a **remote MetaMask-owned origin** (the recommended path),
> not to an extension-local page.
