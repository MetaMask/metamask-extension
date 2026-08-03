# Secret escrow demo (Social + Passkey / TOTP)

Try unlock factors (passkey, password, authenticator app) with wipe/rehydration.

---

## For testers (easiest — no git)

You need:

1. **MetaMask Chrome build zip** (`dist/chrome`, already built with escrow flags)
2. **Mock server zip** (`secret-escrow-mock-server.zip`)
3. **Node.js 18+** ([nodejs.org](https://nodejs.org/)) — only for the mock server

### 1. Start the mock server

1. Unzip `secret-escrow-mock-server.zip`
2. Start it:
   - **macOS:** double-click `start.command`
   - **Windows:** double-click `start.bat`
   - **Terminal:** `node server.mjs`
3. Leave it running. You should see `listening on http://127.0.0.1:8787`.

### 2. Load the extension

1. Unzip the MetaMask Chrome build
2. Chrome → `chrome://extensions` → Developer mode → **Load unpacked**
3. Select the unzipped `chrome` (or `dist/chrome`) folder

### 3. What to try

1. Social-create a wallet
2. Choose **Biometrics / Passkey** (or password) on unlock-factor setup
3. Optionally **Add another** → **Authenticator app**
4. Finish onboarding
5. Wipe / reset the wallet and sign in with the **same** social account
6. Unlock with biometrics, password, or authenticator app

---

## For maintainers (how to produce the zips)

Repos must be siblings:

```text
some-folder/
  core/                  # branch: mg/secret-escrow
  metamask-extension/    # branch: mg/secret-escrow-passkey
```

### Build the portable mock server

```bash
cd metamask-extension
yarn secret-escrow:mock-server:pack
```

Output:

- `../core/packages/secret-escrow-client/mock-server/portable/`
- `../core/packages/secret-escrow-client/mock-server/secret-escrow-mock-server.zip` ← share this

### Build the extension zip

In `.metamaskrc`:

```ini
PASSKEY_ENABLED=true
SECRET_ESCROW_URL=http://127.0.0.1:8787
```

Then:

```bash
cd metamask-extension
# after core packages are built / yarn install with portal deps
yarn build:test
# zip dist/chrome for testers, e.g.:
(cd dist && zip -r ../metamask-secret-escrow-chrome.zip chrome)
```

Share **both** zips together. The extension build must point at `http://127.0.0.1:8787` so it matches the portable mock.

---

## Full local development (optional)

```bash
# Core
cd core && git checkout mg/secret-escrow
yarn install
yarn workspace @metamask/secret-escrow-controller build
yarn workspace @metamask/secret-escrow-client build

# Extension
cd ../metamask-extension && git checkout mg/secret-escrow-passkey
yarn install
cp -n .metamaskrc.dist .metamaskrc
# set PASSKEY_ENABLED=true and SECRET_ESCROW_URL=http://127.0.0.1:8787

# Terminal A
yarn secret-escrow:mock-server

# Terminal B
yarn start
# Load dist/chrome unpacked — see docs/add-to-chrome.md
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Extension can't reach escrow / no factors after wipe | Mock must be running on `:8787` before you enroll and before rehydration. |
| `node: command not found` | Install Node.js LTS from https://nodejs.org/ |
| Passkey prompt never appears | Use a full Chrome tab; platform authenticator (e.g. Touch ID) required. |
| `recoverPasswordWithFactor is not a function` | Rebuild/update core packages and rebuild the extension zip. |

## Notes

- Each tester runs their **own** mock (their own `.secret-escrow-mock.json`).
- Passkeys are tied to that machine’s authenticator and that unpacked extension id.
- Delete `.secret-escrow-mock.json` and restart the mock to clear enrollments.
- **Offline unlock:** social passkey enrollment wraps the **wallet password**
  under the same WebAuthn credential (not only the vault encryption key), so
  biometrics unlock works offline and still unlocks Seedless. After a wipe, use
  escrow (online) once to rehydrate; local wrap is cleared with extension data.
  If you add a typed password after passkey-first setup, the local wrap is
  cleared and unlock falls back to escrow until you re-enroll biometrics.
