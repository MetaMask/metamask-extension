# Secret escrow local demo (Social + Passkey / TOTP)

Short guide to try the social-login unlock-factor flow (passkey, password, TOTP) with wipe/rehydration.

You need **two sibling repos** (the extension uses `portal:../core/...`):

```text
some-folder/
  core/                  # branch: mg/secret-escrow
  metamask-extension/    # branch: mg/secret-escrow-passkey
```

## 1. Checkout & install

```bash
# Core
cd core
git fetch origin
git checkout mg/secret-escrow
yarn install
yarn workspace @metamask/secret-escrow-controller build
yarn workspace @metamask/secret-escrow-client build

# Extension (sibling folder)
cd ../metamask-extension
git fetch origin
git checkout mg/secret-escrow-passkey
yarn install
cp -n .metamaskrc.dist .metamaskrc   # skip if you already have .metamaskrc
```

## 2. Configure `.metamaskrc`

Add (or uncomment) these lines:

```ini
PASSKEY_ENABLED=true
SECRET_ESCROW_URL=http://127.0.0.1:8787
```

Keep a real `INFURA_PROJECT_ID` if you need live network data; the placeholder is fine for onboarding UI.

Social login / seedless must already be available in your local build the same way you normally test social create (OAuth client ids, etc.).

## 3. Run (two terminals)

**Terminal A — mock escrow (required for wipe/rehydration):**

```bash
cd metamask-extension
yarn secret-escrow:mock-server
```

Leave this running. It listens on `http://127.0.0.1:8787` and writes `.secret-escrow-mock.json` under the secret-escrow-client package.

**Terminal B — extension:**

```bash
cd metamask-extension
yarn start
```

## 4. Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `metamask-extension/dist/chrome`
4. Open the extension

More detail: [Add to Chrome](./add-to-chrome.md).

## 5. What to try

1. **Social create** a wallet.
2. On unlock-factor setup, choose **Biometrics / Passkey** (or password).
3. On the manage screen, **Add another** → **Authenticator app** (TOTP). Save the secret / confirm with a live code.
4. Finish onboarding.
5. **Wipe** the wallet (reset / remove extension data) and sign in again with the **same** social account.
6. On `#/onboarding/unlock` you should be able to unlock with:
   - **Unlock with Biometrics**
   - **Use password**
   - **Use authenticator app**

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `recoverPasswordWithFactor is not a function` | Rebuild core packages (step 1), then restart `yarn start` and reload the extension. |
| No passkey / TOTP after wipe | Mock server must be running **and** `SECRET_ESCROW_URL` must be set **before** `yarn start`. Restart the build after changing `.metamaskrc`. |
| Portal / missing package errors | Confirm `core` and `metamask-extension` are siblings, then re-run `yarn install` in the extension. |
| Passkey prompt never appears | Use a full Chrome tab (not only sidepanel); macOS Touch ID / platform authenticator must be available. |

## Notes

- The mock server is **not** inside the extension zip — each person runs it locally.
- Passkeys are tied to this machine’s authenticator and this unpacked extension id; don’t expect one person’s enrolled passkey to unlock someone else’s install.
- Clearing the mock store (delete `.secret-escrow-mock.json` and restart the mock) wipes remote enrollment used for rehydration.
