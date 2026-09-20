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

### 2. Open the test page

Serve it over http so the provider is guaranteed to be injected:

```bash
cd poc && python3 -m http.server 8099
# then open http://localhost:8099/state-log-export.html
```

Opening the file directly (`file://…/state-log-export.html`) also works, but only if
"Allow access to file URLs" is enabled for MetaMask on `chrome://extensions`. That
toggle is off by default and resets whenever the extension is removed and re-added.

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
| `app/scripts/metamask-controller.js` | Added `handleGetStateLogsRequest()` — opens approval and returns the state payload the confirmation resolves with |
| `ui/pages/confirmations/confirmation/templates/state-log-export.ts` | Consent confirmation; builds the payload with `window.logStateString()` on submit |
| `poc/state-log-export.html` | Mock support page — the UI a user would see in the chatbot flow |

## Security properties

- Request flows through the provider RPC pipeline and native confirmation system
- Approval is required before any state payload is returned
- Routes through the same `logStateString()` path as the Settings download, which excludes the encrypted vault; private keys and SRP are never present
- No custom content-script or runtime-message bridge remains in the PoC

## What's different from production MVP

| PoC | Production |
|---|---|
| Local file page for demo/testing | Real chatbot widget on `support.metamask.io` |
| Payload crosses the RPC boundary as one large string | Consider a transfer mechanism that avoids a multi-MB JSON-RPC response |
| Allowlisted for every origin via `unrestrictedMethods` | Restrict to the support surface before production rollout |
