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

Open `poc/state-log-export.html` directly in Chrome (File → Open, or drag into browser tab).

> The content script already runs on `file://` origins so no server is needed.

### 3. Click "Download State Logs"

1. Check the consent checkbox
2. Click the button
3. A `MetaMask-state-logs-<timestamp>.json` file downloads automatically

---

## What was changed

| File | Change |
|---|---|
| `app/scripts/contentscript.js` | Added `setupStateLogBridge()` IIFE — listens for `postMessage`, relays to background, triggers download |
| `app/scripts/background.js` | Added `onMessage` handler for `METAMASK_REQUEST_STATE_LOGS` — returns `controller.getState()` |
| `poc/state-log-export.html` | Mock support page — the UI a user would see in the chatbot flow |

## Security properties

- Origin validated in content script: only `https://support.metamask.io` and `localhost` accepted
- Background validates `sender.tab` — rejects any call that didn't originate from a content script
- State data never touches page JavaScript — download triggered directly from content script scope
- Routes through `controller.getState()` which excludes the encrypted vault; private keys and SRP are never present

## What's different from production MVP

| PoC | Production |
|---|---|
| Uses `controller.getState()` | Should use `logStateString()` path to include logs + platform metadata |
| `file://` origin allowed | Remove for production; `localhost` should also be removed |
| No i18n | All strings go in `app/_locales/en/messages.json` |
| Test HTML page | Real chatbot widget on `support.metamask.io` |
