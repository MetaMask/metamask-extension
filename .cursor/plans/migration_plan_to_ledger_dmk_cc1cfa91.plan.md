---
name: Migration Plan to Ledger DMK
overview: Migrate Ledger integration from `ledgerjs` (iframe-based) to Ledger Device Management Kit (DMK) running directly in the offscreen document.
todos: []
---

# Migration Plan to Ledger DMK

This plan outlines the steps to replace the existing iframe-based Ledger integration with the new Ledger Device Management Kit (DMK) and Ethereum Signer Kit, running directly within the extension's offscreen document.

## 1. Dependencies

Add the following package to `package.json`:

- [`@ledgerhq/device-signer-kit-ethereum`](https://www.npmjs.com/package/@ledgerhq/device-signer-kit-ethereum) (Required for high-level Ethereum operations like signing transactions and messages)

## 2. Refactor `app/offscreen/ledger.ts`

Completely rewrite [`app/offscreen/ledger.ts`](app/offscreen/ledger.ts) to implement the DMK integration.

### Core Changes:

- **Remove Iframe**: Delete all code related to creating the iframe, `window.addEventListener('message')`, and forwarding messages.
- **Initialize DMK**:
- Import `DeviceManagementKitBuilder`, `ConsoleLogger` from `@ledgerhq/device-management-kit`.
- Import `webHidTransportFactory` from `@ledgerhq/device-transport-kit-web-hid`.
- Import `EthereumSigner` from `@ledgerhq/device-signer-kit-ethereum`.
- Initialize `dmk` with `webHidTransportFactory`.
- **Implement Message Handling**:
- Update `chrome.runtime.onMessage` listener to handle `LedgerAction`s directly using DMK.
- **Connection (`makeApp`)**:
- Use `dmk.listenToDevices` to find a device.
- Use `dmk.connect` to establish a session.
- Instantiate `EthereumSigner` with the session.
- **Get Public Key (`getPublicKey`)**:
- Call `signer.getAddress(path)`.
- Return `{ publicKey, address, chainCode }`.
- **Sign Transaction (`signTransaction`)**:
- Call `signer.signTransaction(path, tx)`.
- Return `{ v, s, r }`.
- **Sign Message (`signPersonalMessage`)**:
- Call `signer.signMessage(path, message)`.
- Return `{ v, s, r }`.
- **Sign Typed Data (`signTypedData`)**:
- Call `signer.signEIP712Message(...)`.
- Return `{ v, s, r }`.

## 3. Verify Bridge Communication

Ensure the responses sent back from `app/offscreen/ledger.ts` match the expected format in [`app/scripts/lib/offscreen-bridge/ledger-offscreen-bridge.ts`](app/scripts/lib/offscreen-bridge/ledger-offscreen-bridge.ts).

- `getPublicKey`: Expects `{ publicKey: string, address: string, chainCode?: string }`.
- `deviceSignTransaction`: Expects `{ v: string, s: string, r: string }`.
- `deviceSignMessage`: Expects `{ v: number, s: string, r: string }`.

## 4. Cleanup

- Remove usage of `CallbackProcessor` in `app/offscreen/ledger.ts`.
- (Optional) Remove `app/offscreen/callback-processor.ts` if unused elsewhere.