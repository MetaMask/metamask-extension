# Hyperliquid MMPay Auto-Provisioning Prototype

**Status: Implementation complete, pending live E2E verification**
**Branch:** `jl/eip-5792-middleware-3-0-0`
**Last updated:** 2026-02-26

---

## Goal

Build a prototype within metamask-extension that detects Hyperliquid USDC deposits on Arbitrum and automatically injects `requiredAssets` into the transaction so the existing MMPay/auxiliaryFunds pipeline can provision USDC -- without any changes needed from the Hyperliquid dapp.

---

## Checkpoints

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Research: verify Hyperliquid deposit tx format | Done | Deposit = ERC-20 `transfer(bridgeAddr, amount)` on the USDC contract. Alternative: `batchedDepositWithPermit` on the bridge contract. Confirmed via Arbiscan, Codeslaw, and Hyperliquid docs. |
| 2 | Create detection middleware | Done | `app/scripts/lib/auxiliary-funds/auxiliary-funds-middleware.ts` -- detects both `transfer` and `batchedDepositWithPermit` patterns, attaches `requiredAssets` to `req`. 7 unit tests passing. |
| 3 | Wire `requiredAssets` through `addDappTransaction` | Done | `app/scripts/lib/transaction/util.ts` -- reads `requiredAssets` from `requestContext` and includes in `transactionOptions`. 35 existing tests still passing. |
| 4 | Register middleware in `metamask-controller.js` | Done | Added to both EIP-1193 and multichain provider engines, placed immediately before `this.metamaskMiddleware`. 157 controller tests passing. |
| 5 | Live E2E verification on `app.hyperliquid.xyz` | Pending | Requires: (a) `yarn start` dev build, (b) Arbitrum wallet with insufficient USDC, (c) visit Hyperliquid and initiate a deposit to confirm `RequiredTokensRow` renders and MMPay pipeline triggers. |

---

## Architecture

```
Hyperliquid dapp
  |  eth_sendTransaction (USDC transfer to bridge)
  v
auxiliaryFundsMiddleware          <-- NEW: detects deposit, sets req.requiredAssets
  |  propagateToContext copies req props to MiddlewareContext
  v
createWalletMiddleware
  |  calls processTransaction(txParams, req, context)
  v
addDappTransaction                <-- MODIFIED: reads context.get('requiredAssets')
  |  includes requiredAssets in transactionOptions
  v
TransactionController.addTransaction({ requiredAssets })
  |
  v
TransactionPayController          (existing) processes requiredAssets
  |
  v
RequiredTokensRow UI              (existing) renders in confirmation screen
  |
  v
MMPay pipeline provisions USDC    (existing) bridges/swaps funds from other chains
```

---

## Files Changed

### Created

| File | Purpose |
|------|---------|
| `app/scripts/lib/auxiliary-funds/auxiliary-funds-middleware.ts` | Detection middleware: intercepts `eth_sendTransaction` on Arbitrum, decodes calldata, detects Hyperliquid bridge deposits, attaches `requiredAssets` to the request |
| `app/scripts/lib/auxiliary-funds/auxiliary-funds-middleware.test.ts` | 7 unit tests covering both deposit patterns, negative cases, and edge cases |

### Modified

| File | Change |
|------|--------|
| `app/scripts/lib/transaction/util.ts` | Extract `requiredAssets` from `requestContext` and pass through `transactionOptions` to `TransactionController.addTransaction` |
| `app/scripts/metamask-controller.js` | Import and register `createAuxiliaryFundsMiddleware` in both provider engine pipelines, before `metamaskMiddleware` |

---

## Key Research Findings

### Hyperliquid Deposit Contract

- **Bridge contract (Bridge2):** `0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7` on Arbitrum
- **USDC contract:** `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` (native USDC on Arbitrum)
- **Chain ID:** `0xa4b1` (42161) -- already in `ALLOWED_BRIDGE_CHAIN_IDS`

### Deposit Methods

1. **Primary: USDC `transfer(address,uint256)`**
   - Selector: `0xa9059cbb`
   - `to` = USDC contract, calldata recipient = bridge address
   - Most common path for individual deposits

2. **Alternative: `batchedDepositWithPermit(tuple[])`**
   - Selector: `0xb30b5bce`
   - `to` = bridge contract directly
   - Uses EIP-2612 permit for gas efficiency
   - Tuple: `(address user, uint64 usd, uint256 deadline, uint8 v, bytes32 r, bytes32 s)`

### How `req` Properties Reach `requestContext`

The `@metamask/json-rpc-engine` v2 compatibility layer (`propagateToContext`) automatically copies non-JSON-RPC string properties from the legacy `req` object to the `MiddlewareContext` Map. This is the same mechanism used by:
- PPOM middleware: sets `req.securityAlertResponse`
- Our middleware: sets `req.requiredAssets`

Both are then readable via `requestContext.get('securityAlertResponse')` and `requestContext.get('requiredAssets')` in `addDappTransaction`.

---

## Risks and Open Questions

| Risk | Severity | Mitigation |
|------|----------|------------|
| **MMPay backend not ready** | High | The middleware plumbing is correct regardless. If the provisioning backend isn't functional yet, `requiredAssets` will be on the transaction meta but no actual funding will happen. Need to verify with MMPay team. |
| **False positives (user has enough USDC)** | Medium | The prototype always attaches `requiredAssets`. A production version should check the user's USDC balance on Arbitrum first and only attach when insufficient. The MMPay pipeline may already handle this gracefully. |
| **Hardcoded addresses** | Low (prototype) | The bridge and USDC addresses are hardcoded for Hyperliquid on Arbitrum. A production version would need a registry of known protocol contracts. |
| **Permit flow edge case** | Low | For `batchedDepositWithPermit`, the `signTypedData` call for the permit signature happens in a separate RPC call before the bridge contract call. Our middleware only sees the bridge call, which is fine -- the permit is just an authorization, the actual USDC movement happens in the bridge call. |

---

## Next Steps (Post-Prototype)

1. **Live E2E test** -- Build extension with `yarn start`, connect to `app.hyperliquid.xyz` on Arbitrum with a wallet that has insufficient USDC, initiate a deposit, and verify the confirmation UI shows `RequiredTokensRow`.
2. **Balance check** -- Add a pre-check that queries the user's USDC balance on Arbitrum before attaching `requiredAssets`. Skip attachment if balance is sufficient.
3. **Generalize** -- Replace hardcoded addresses with a configurable registry. Consider a generic "ERC-20 transfer with insufficient balance" detector.
4. **Metrics** -- Add MetaMetrics events when `requiredAssets` are detected and when the MMPay provisioning is triggered.
5. **Feature flag** -- Gate behind a remote feature flag before shipping to production.
