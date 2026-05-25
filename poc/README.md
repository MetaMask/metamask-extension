# PoC: 1-Click State Log Export

Proof of concept for the MVP described in `ideas/state-log-exports/PRD-1-click-state-log-export.md`.

## How to run locally

### 1. Build and load the extension

```bash
# From metamask-extension root
yarn install
yarn start          # dev build with watch
# OR
yarn build          # production build
```

Then load the unpacked extension in Chrome:
- `chrome://extensions` → Enable Developer Mode → Load unpacked → point at `dist/chrome`

### 2. Serve the test page locally

From the repository root, start a simple local web server:

```bash
cd poc
python3 -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500/state-log-export.html
```

Do not open the page with `file://`. The RPC-only flow uses the injected provider, and local file pages resolve to a `null` origin.

### 3. Click "Download State Logs"

1. Make sure MetaMask is detected on the page
2. Click the button
3. Approve the MetaMask confirmation
4. A `MetaMask-state-logs-<timestamp>.json` file downloads automatically

---

## What was changed

| File | Change |
|---|---|
| `app/scripts/lib/rpc-method-middleware/handlers/get-state-logs.ts` | Added `metamask_getStateLogs` handler in the provider RPC pipeline |
| `app/scripts/metamask-controller.js` | Added `handleGetStateLogsRequest()` — opens approval and returns the state log string from the approval UI |
| `ui/pages/confirmations/confirmation/templates/state-log-export.ts` | Approval UI builds state logs via `window.logStateString()` (same as Settings export) |
| `poc/state-log-export.html` | Mock support page — the UI a user would see in the chatbot flow |

## Security properties

- Request flows through the provider RPC pipeline and native confirmation system
- Approval is required before any state payload is returned
- State logs are built via `window.logStateString()` in the approval UI (same path as Settings → Download state logs), which excludes the encrypted vault; private keys and SRP are never present
- No custom content-script or runtime-message bridge remains in the PoC

## What's different from production MVP

| PoC | Production |
|---|---|
| Local file page for demo/testing | Real chatbot widget on `support.metamask.io` |
| No i18n | All strings go in `app/_locales/en/messages.json` |
| No allowlisting on the custom method yet | Add explicit support-surface policy before production rollout |
