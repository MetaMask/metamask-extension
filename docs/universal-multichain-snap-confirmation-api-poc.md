# Universal Multichain Snap Confirmation API POC

## Purpose

This POC proves that a Snap can request a native MetaMask transaction confirmation for a universal multichain transaction.

The API is protocol-agnostic. The Solana wallet snap is only the first consumer used to exercise the flow end to end.

## Architecture Summary

Snaps Platform defines and validates the Snap API. Extension implements the client hook and approval flow. Core stores pending confirmation display data. Extension UI renders the native confirmation. The Solana wallet snap is the first consumer.

Runtime flow:

1. Snap builds a protocol transaction.
2. Snap calls `snap_confirmTransaction`.
3. Snaps Platform validates the request and invokes the confirmation hook.
4. Extension receives the Snap API request through that hook.
5. Extension stores the lean transaction payload in `MultichainTransactionsController.pendingTransactions`.
6. Extension creates an `ApprovalController` request with type `universalTransaction`.
7. Extension Confirm UI renders the approval using the pending transaction data.
8. User approves or rejects.
9. Extension resolves the Snap API request.
10. Snap signs/submits only if approved.

## Flow Diagram

```mermaid
sequenceDiagram
  participant Snap as Snap
  participant SnapAPI as Snaps Platform snap_confirmTransaction
  participant Extension as Extension service worker
  participant Core as MultichainTransactionsController
  participant Approval as ApprovalController
  participant UI as Confirm UI
  participant User as User

  Snap->>Snap: Build protocol transaction
  Snap->>SnapAPI: Request native confirmation
  SnapAPI->>SnapAPI: Validate params and permission
  SnapAPI->>Extension: Invoke showUniversalTransactionConfirmation hook
  Extension->>Core: addPendingTransaction(approvalId, payload)
  Extension->>Approval: addRequest(type: universalTransaction)
  Approval->>UI: Activate confirmation
  UI->>Core: Read pendingTransactions[approvalId]
  UI->>User: Render native confirmation
  User->>UI: Approve / reject
  UI->>Approval: Resolve approval
  Approval->>Extension: Return decision
  Extension->>Core: removePendingTransaction(approvalId)
  Extension->>SnapAPI: true / false
  SnapAPI->>Snap: Return decision
  Snap->>Snap: Sign and submit if approved
```

## Changes By Repository And Package

### MetaMask/snaps

#### `@metamask/snaps-rpc-methods`

Defines the new restricted method.

- Adds `snap_confirmTransaction`.
- Defines `ConfirmTransactionParams` with `chainId`, `accountId`, `to`, `amount`, optional `assetId`, and optional `fee`.
- Validates the protocol-agnostic payload, including CAIP chain and asset IDs.
- Registers the method in the restricted method registry.
- Declares the `showUniversalTransactionConfirmation` hook.
- Returns a boolean approval result to the Snap.

#### `@metamask/snaps-sdk`

Exposes the permission in Snap developer-facing types.

- Adds `snap_confirmTransaction: EmptyObject` to `InitialPermissions`.
- Allows Snap manifests and Snap code to type-check when requesting the new permission.

#### `@metamask/snaps-utils`

Adds manifest validation support.

- Adds `snap_confirmTransaction` to manifest permission validation.
- Allows Snaps to declare `"snap_confirmTransaction": {}` in `initialPermissions`.

#### `@metamask/snaps-controllers`

Allows the permission through Snap installation and permission handling.

- Adds `snap_confirmTransaction` to `ALLOWED_PERMISSIONS`.
- Ensures the restricted method permission is accepted by Snap controller permission handling.

### MetaMask/core

#### `@metamask/multichain-transactions-controller`

Provides the temporary Snap-to-UI state bridge.

- Adds non-persisted `pendingTransactions` keyed by `approvalId`.
- Adds `PendingMultichainTransaction`.
- Adds messenger actions: `addPendingTransaction`, `updatePendingTransaction`, `removePendingTransaction`, and `getPendingTransaction`.
- Lets the extension UI read the Snap-provided display payload while the approval is active.

### MetaMask/metamask-extension

#### Snaps Platform Integration

Connects the Snaps Platform hook to extension approval infrastructure.

- Implements `showUniversalTransactionConfirmation`.
- Creates an `approvalId`.
- Writes the lean Snap payload into `MultichainTransactionsController.pendingTransactions`.
- Creates an `ApprovalController` request with type `universalTransaction`.
- Resolves the Snap API request based on approval or rejection.
- Cleans up pending transaction state after resolution.

#### Confirmation UI

Renders the native confirmation.

- Routes `universalTransaction` approvals to universal confirmation UI.
- Reads pending transaction data by `approvalId`.
- Renders heading, From, To, Network, and Network Fee rows.
- Reuses wallet-initiated header so Advanced Details works.
- Matches EVM Send loading and fee-row visual behavior.
- Blocks confirmation with standard danger alerts when client-side multichain balances cannot cover the raw transfer amount plus any Snap-provided aggregate fee requirement.
- Uses an alert row for Network Fee so universal affordability alerts render inline instead of only blocking the footer.
- Converts client display-unit multichain balances into raw units before comparing against the raw Snap confirmation payload.
- Displays non-EVM native Send balances at full token precision because the Max button is hidden and truncated balance text can leave hidden dust that covers fees during QA.

#### Send Flow Integration

Aligns non-EVM Send loading with EVM Send.

- Navigates to Confirm with `loader=Send` while Snap approval is being prepared.
- Replaces the old Send loader screen with the EVM-style Confirm skeleton.
- Removes Send-time Snap `onAmountInput` validation for non-EVM sends.
- Validates Send amount against client balance state before the Snap builds the transaction.

### MetaMask/snap-solana-wallet

#### `@metamask/solana-wallet-snap`

Provides the first consumer.

- `SendService` builds the Solana transaction.
- Calls `snap_confirmTransaction` before signing or submitting.
- Passes account, recipient, chain ID, raw amount, optional asset ID, and optional raw fee amount.
- Treats the fee amount as the aggregate execution fee / required amount for the fee asset, not a protocol-specific rent or account-creation field.
- Continues with `SolMethod.SignAndSendTransaction` only if approved.

## What This POC Proves

- A Snap can delegate transaction confirmation UX to the extension.
- The Snap API can be the seam between protocol execution and native confirmation.
- Existing `ApprovalController` and Confirm UI architecture can support universal multichain transaction confirmations.
- Core controller state can bridge async Snap requests to React UI without moving protocol transaction construction into extension.

## Balance Centralization Is Separate

This POC is about native confirmation UX ownership, not balance retrieval ownership.

Non-EVM balance centralization can be solved independently: clients can own balance retrieval/caching through assets and balances controllers, then pass the relevant native/token balances to existing Snap-rendered confirmations so the Snap can gate its own confirm button without fetching balances itself.

The Send flow balance check is also separable from this POC. The client no longer calls the Snap `onAmountInput` path to validate non-EVM amounts before creating the send request. Send validates entered amounts against client-owned balance state, then the native universal confirmation performs the final affordability check against the Snap-provided raw amount and aggregate fee requirement.

One possible balance-centralization path:

- Ensure clients/controllers refresh and cache non-EVM balances before Send uses them.
- Remove Send form calls to Snap `onAmountInput` for amount validation. This POC now does this for the universal confirmation path.
- Validate Send amount locally against `MultichainBalancesController` / assets-controller state.
- Pass only the relevant client-owned balances to the Snap when creating the send request: native balance, and selected token balance when sending a token.
- Let the Snap continue constructing the protocol transaction and calculating fee / protocol-specific required native amount.
- Let existing Snap-rendered confirmations use those client-provided balances to gate their own confirm button.
- For native universal confirmations, use client-owned blocking alerts for final affordability checks.

Native confirmations make client-owned balance alerts cleaner because the client owns the confirmation footer and blocking alerts. They are not required just to remove duplicate balance fetching from Snaps.

## What This POC Does Not Cover

- Final API naming or payload schema.
- Final permission/access policy.
- Security and privacy review.
- Validation with protocols beyond Solana.
- Production feature gating.
- Full test coverage.
- Full non-EVM balance centralization; see the separate Obsidian note `[[Non-EVM Balance Centralization]]`.
