# Getting Started

This doc specifies the development guide on the QrSync feature.
Currently, QrSync feature is gated behind the environment based feature flag, `QR_SYNC_ENABLED`.

## Enable QrSync

Set the flag in `.metamaskrc`, then restart the development build:

```bash
QR_SYNC_ENABLED='true'
yarn start
```

## Relevant files

See the implementation plan's [UI implementation](./qr-sync-wallet-export-implementation-plan.md#ui-implementation)
and [Key files](./qr-sync-wallet-export-implementation-plan.md#key-files)
sections for the QrSync file structure and responsibilities.

## Navigate to QrSync

1. Open and unlock the extension.
2. Open **Settings**.
3. Select **Sync with mobile**.

## Manual testing

1. Verify that a QR code is displayed.
   - Development builds also display the QR payload text below the QR code. Use
     this value with a mobile simulator when camera scanning is unavailable.
2. Scan the QR code with MetaMask Mobile.
3. Enter the six-digit verification code in the extension.
4. Enter the wallet password, select the wallets to sync, and click **Sync**.
5. Verify the syncing and success screens, then confirm the selected wallets and accounts are available on mobile.
