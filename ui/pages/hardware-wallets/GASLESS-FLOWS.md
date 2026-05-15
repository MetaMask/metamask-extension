# Bridge ↔ Transaction Controller: Gasless Flows

## Controllers Involved

| Controller | Package | Role |
|---|---|---|
| `BridgeStatusController` | `@metamask/bridge-status-controller` | Orchestrates bridge tx submission, calls `TransactionController.addTransactionBatch` |
| `TransactionController` | `@metamask/transaction-controller` | Manages tx lifecycle (add → sign → publish), invokes publish hooks |
| `DelegationController` | `@metamask/delegation-controller` | Signs EIP-7702 delegations (redeemDelegations) |
| `SmartTransactionsController` | `@metamask/smart-transactions-controller` | Submits via Sentinel STX (sendBundle) |
| `TransactionPayController` | `@metamask/transaction-pay-controller` | Subscription-sponsored gasless (highest priority) |

## End-to-End Submission Flow

```
UI: useSubmitBridgeTransaction
  │
  ├─ Has intentData? ──→ submitBridgeIntent → BridgeStatusController:submitIntent
  │                                          (off-chain intent, no TC interaction)
  │
  └─ No intentData ──→ submitBridgeTx → BridgeStatusController:submitTx
                                          │
                                          ▼
                          BridgeStatusControllerInit.addTransactionBatchFn
                                          │
                              ┌───────────┴───────────┐
                              │ accountSupports7702() │
                              └───────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              supports7702    !supports7702    (HW wallet)
                    │               │               │
                    ▼               ▼               ▼
          addTransactionBatch   addTransactionBatch  addTransactionBatch
          (original request)   (isGasFeeSponsored: false,
                                isGasFeeIncluded: false,
                                disable7702: true)
                    │
                    ▼
          TransactionController internal lifecycle:
          1. afterAdd hook → SubscriptionService:submitSubscriptionSponsorshipIntent
          2. beforeSign hook → EnforceSimulationHook
          3. User signs → keyringController.signTransaction
          4. publish hook → THE GASLESS ROUTING DECISION
          5. TransactionController:transactionStatusUpdated event
                    │
                    ▼
          BridgeStatusController subscribes to:
          TransactionController:transactionStatusUpdated
```

## The Publish Hook: Gasless Routing Decision

Defined in `transaction-controller-init.ts:406-528`. The `publishHook` is a **cascading priority chain**:

```
publishHook(transactionMeta, signedTx)
  │
  ├─ Step 1: TransactionPayPublishHook (Subscription-sponsored)
  │   └─ If payResult.transactionHash → RETURN (done, no gas paid)
  │
  ├─ Step 2: Delegation7702PublishHook (Sentinel Relay)
  │   Condition: keyringSupports7702 AND
  │             (!isSmartTransaction OR !sendBundleSupport OR isExternalSign)
  │   └─ If result.transactionHash → RETURN (sentinel_relay metric)
  │
  ├─ Step 3: Smart Transactions (Sentinel STX / sendBundle)
  │   Condition: isSmartTransaction AND
  │             (sendBundleSupport OR no selectedGasFeeToken)
  │   └─ If result.transactionHash → RETURN (sentinel_stx metric)
  │
  └─ Step 4: Fallback → { transactionHash: undefined }
      → TransactionController submits normally via eth_sendRawTransaction
```

## Flow 1: EIP-7702 Gasless (Sentinel Relay) — `Delegation7702PublishHook`

### Entry Conditions

From `transaction-controller-init.ts:444-477`:

- `accountSupports7702(from, keyringController)` → `true`
  - Keyring must be `HD Key Tree` or `Simple Key Pair`
  - **Hardware wallets excluded** — see `shared/constants/keyring.ts:KEYRING_TYPES_SUPPORTING_7702`
- AND one of:
  - Smart transactions NOT enabled for this chain, OR
  - `sendBundle` NOT supported for this chain, OR
  - `isExternalSign` (external signing edge case)

### Quote-Time Gating

From `useGasIncluded7702.ts`. Controls whether the quote request includes `gasIncluded7702=true`:

| Condition | Result |
|---|---|
| Hardware wallet | `false` — no 7702 quotes requested |
| `isSendBundleSupportedForChain && isSmartTransaction` | `false` — use STX path instead |
| Non-swap bridge tx without `isGaslessBridgeWith7702Enabled` flag | `false` |
| Non-EVM chain | `false` |
| Otherwise | Checks `isRelaySupported(chainId)` via Sentinel API |

### Execution Flow

From `delegation-7702-publish.ts`:

```
1. Check EIP-7702 support
   TransactionController:isAtomicBatchSupported({ address, chainIds })
   → Returns atomicBatchSupport array per chain
   → checkEip7702Support() checks delegationAddress + isSupported

2. Determine if gas fee token transfer is needed
   if (isGasFeeIncluded || isGasFeeSponsored):
     includeTransfer = false  (no ERC-20 gas fee token transfer needed)
   else:
     includeTransfer = true   (need to transfer gas fee token to pay sponsor)

3. Remove nonce from txParams
   TransactionController:updateTransaction (removes nonce for delegation)

4. Build delegation + sign
   convertTransactionToRedeemDelegations({
     transaction,
     messenger,
     additionalExecutions: includeTransfer ? [ERC20.transfer(gasFeeToken)] : [],
     authorization: delegationAddress ? undefined : { upgradeContractAddress }
   })
   │
   ├─ getDefaultTransactionExecutions() → from txParams.to/data/value
   ├─ buildDefaultCaveats():
   │   ├─ LimitedCallsEnforcer (limit: 1) — one-time use
   │   └─ ExactExecutionEnforcer or ExactExecutionBatchEnforcer
   │       (single vs batch based on execution count)
   ├─ signAndWrapDelegation():
   │   └─ DelegationController:signDelegation({ chainId, delegation })
   │       → Returns EIP-712 typed data signature
   └─ buildAuthorizationList() (if account not yet upgraded):
       ├─ resolveUpgradeContractAddress()
       │   └─ TransactionController:isAtomicBatchSupported → get upgrade address
       ├─ getNextNonce()
       │   └─ TransactionController:getNonceLock
       └─ KeyringController:signEip7702Authorization({ chainId, contractAddress, from, nonce })

5. Submit via Sentinel Relay
   submitRelayTransaction({
     chainId,
     data: encoded redeemDelegations calldata,
     to: DelegationManager address,
     authorizationList (if account upgrade needed),
     metadata: { txType, client, origin }
   })
   → eth_sendRelayTransaction to Sentinel API
   → Returns UUID

6. Poll for result
   waitForRelayResult({ chainId, uuid, interval: 1000ms })
   → GET /smart-transactions/{uuid}
   → Until status === 'VALIDATED'
   → Returns transactionHash
```

### Key Characteristics

- Transaction is **wrapped as a `redeemDelegations` call** to the DelegationManager contract
- User's EOA is **delegated** (EIP-7702) to a smart account implementation
- Delegation is **single-use** (`LimitedCallsEnforcer: limit 1`) and **exact execution** (can only execute the specific calldata)
- An **authorization list** (EIP-7702 `setCode`) may be included to upgrade the account on-chain
- Goes through **Sentinel relay** (`eth_sendRelayTransaction`), not directly to the network
- The relay sponsor pays gas; the user's account executes via the delegated smart account

## Flow 2: Smart Transactions (Sentinel STX / sendBundle)

### Entry Conditions

From `transaction-controller-init.ts:479-511`:

- `isSmartTransaction` enabled for this chain (remote feature flags + user opt-in)
- AND (`sendBundleSupport` OR no `selectedGasFeeToken`)

This is the **preferred path for HW wallets** because:
- No EIP-7702 delegation required
- Standard EIP-1559 signing only
- `sendBundle` bundles multiple txs and submits to Sentinel

### Execution Flow

```
1. submitSmartTransactionHook({
     transactionMeta,
     signedTransactionInHex,
     transactionController,
     smartTransactionsController,
     controllerMessenger: initMessenger,
     isSmartTransaction,
     featureFlags
   })
   → SmartTransactionsController handles submission to Sentinel
   → Returns transactionHash
```

### Batch Transactions

For `publishBatchHook` (line 530):
- Uses `submitBatchSmartTransactionHook`
- Takes all transactions in the batch, submits via `SmartTransactionsController`

## Flow 3: TransactionPay (Subscription-sponsored)

### Entry Conditions

Always checked first in the publish hook cascade.

### Execution Flow

```
TransactionPayPublishHook.getHook()(transactionMeta, signedTx)
  → TransactionPayController:getStrategy
  → If subscription active and covers this tx:
     Returns { transactionHash } — sponsored by MetaMask subscription
  → Else: returns undefined (falls through to next hook)
```

Highest-priority gasless path. If a user has an active subscription (e.g., MetaMask Shield), gas is sponsored without needing 7702 or STX.

## Messenger Actions & Events

### BridgeStatusController → TransactionController (actions)

| Messenger Action | Purpose |
|---|---|
| `TransactionController:addTransactionBatch` | Submits bridge tx (approval + swap) as a batch |
| `TransactionController:getState` | Reads current tx state |
| `TransactionController:isAtomicBatchSupported` | Checks 7702 support before adding tx |
| `TransactionController:updateTransaction` | Updates tx during 7702 flow (remove nonce) |
| `TransactionController:estimateGasFee` | Gas estimation |

### TransactionController → BridgeStatusController (events)

| Messenger Event | Purpose |
|---|---|
| `TransactionController:transactionStatusUpdated` | BridgeStatusController tracks tx status for its own state updates |

### TransactionController → DelegationController (during 7702 publish)

| Messenger Action | Purpose |
|---|---|
| `DelegationController:signDelegation` | Signs the EIP-712 delegation structure |

### TransactionController → KeyringController (during 7702 publish)

| Messenger Action | Purpose |
|---|---|
| `KeyringController:signEip7702Authorization` | Signs EIP-7702 authorization for account upgrade |

### TransactionController Internal Events (metrics)

| Event | Handler |
|---|---|
| `TransactionController:unapprovedTransactionAdded` | `handleTransactionAdded` |
| `TransactionController:transactionApproved` | `handleTransactionApproved` |
| `TransactionController:transactionConfirmed` | `handleTransactionConfirmed` |
| `TransactionController:transactionSubmitted` | `handleTransactionSubmitted` |
| `TransactionController:transactionFailed` | `handleTransactionFailed` |
| `TransactionController:transactionRejected` | `handleTransactionRejected` |
| `TransactionController:transactionDropped` | `handleTransactionDropped` |
| `TransactionController:postTransactionBalanceUpdated` | `handlePostTransactionBalanceUpdate` |

## Decision Matrix: 7702 vs STX vs TransactionPay vs Sequential

| Factor | EIP-7702 Relay | Smart Transactions (STX) | TransactionPay | Sequential (non-batch) |
|---|---|---|---|---|
| **HW wallets** | Excluded | Supported (batch) | Supported | Supported (non-batch) |
| **UI tracker** | N/A for HW | `useHwBatchSignTracker` | `useHwBatchSignTracker` | `useHwSequentialSignTracker` |
| **Correlation** | N/A for HW | `batchId` | `batchId` | tx ID |
| **Account requirement** | EOA upgraded (7702) | Any account | Any account w/ subscription | Any account |
| **Signing** | EIP-712 + EIP-7702 sigs | Standard EIP-1559 | Standard EIP-1559 | Standard EIP-1559 |
| **Submission** | Sentinel relay | Sentinel STX `sendBundle` | Pay controller | `eth_sendRawTransaction` |
| **User pays gas?** | No (sponsor pays) | No (STX sponsor) | No (subscription) | **Yes** |
| **Requires STX enabled** | No | Yes | No | No (STX disabled) |
| **Priority** | 2nd | 3rd | 1st | 4th (fallback) |
| **Bridge quote flag** | `gasIncluded7702=true` | N/A | N/A | N/A |

### HW Wallet Path Selection

For HW wallets (7702 excluded, `disable7702=true` forced):

```
STX enabled?
  ├─ Yes → Batch path → addTransactionBatchWithHook → useHwBatchSignTracker
  └─ No  → Sequential path → addTransaction (individual) → useHwSequentialSignTracker
```

## How BridgeStatusController Modifies the Transaction

From `bridge-status-controller-init.ts:38-56`, the `addTransactionBatchFn` wrapper inspects the account's keyring type before forwarding to `TransactionController`:

```
For accounts that DON'T support 7702 (hardware wallets, snaps):
  addTransactionBatch({
    ...request,
    isGasFeeSponsored: false,  // Force off — no 7702 sponsorship
    isGasFeeIncluded: false,   // Force off — no gas included
    disable7702: true,         // Prevent any 7702 processing
  })

For accounts that DO support 7702 (HD Key Tree, Simple Key Pair):
  addTransactionBatch(request)  // Pass through original flags from quote
```

The quote response determines the initial gasless flags (`isGasFeeIncluded`, `isGasFeeSponsored`), which then flow into the publish hook's routing decision. The backend returns these flags based on whether `gasIncluded7702=true` was in the quote request.

## Key Files

| File | Purpose |
|---|---|
| `ui/pages/bridge/hooks/useSubmitBridgeTransaction.ts` | UI submit entry point |
| `ui/pages/bridge/hooks/useGasIncluded7702.ts` | Quote-time 7702 gating |
| `ui/pages/bridge/hooks/useIsSendBundleSupported.ts` | sendBundle chain support check |
| `ui/ducks/bridge-status/actions.ts` | Redux actions → BridgeStatusController |
| `ui/ducks/bridge/selectors.ts` | `getIsStxEnabled` selector (drives batch vs sequential tracker selection) |
| `ui/pages/bridge/hardware-wallets/useHwSequentialSignTracker.ts` | Sequential (non-batch) HW transaction tracking by tx ID |
| `ui/pages/bridge/hardware-wallets/useHwBatchSignTracker.ts` | Batch HW transaction tracking by batchId |
| `app/scripts/messenger-client-init/bridge-status-controller-init.ts` | BridgeStatusController init + `addTransactionBatchFn` wrapper |
| `app/scripts/messenger-client-init/confirmations/transaction-controller-init.ts` | TransactionController init + publish hook cascade |
| `app/scripts/lib/transaction/hooks/delegation-7702-publish.ts` | EIP-7702 Sentinel relay publish hook |
| `app/scripts/lib/transaction/delegation.ts` | Converts tx to `redeemDelegations` + signs delegation |
| `app/scripts/lib/transaction/transaction-relay.ts` | Sentinel relay submit + poll |
| `app/scripts/lib/transaction/sentinel-api.ts` | Sentinel network flags (relay, sendBundle, STX) |
| `app/scripts/lib/account-supports-7702.ts` | Keyring-based 7702 eligibility check |
| `shared/constants/keyring.ts` | `KEYRING_TYPES_SUPPORTING_7702` constant |
| `ui/pages/confirmations/hooks/gas/useIsGaslessSupported.ts` | Confirmation-time gasless support detection |
