# Swaps and Bridge Sentry reference

This document is the reference for performance traces emitted by the unified
Swaps/Bridge experience. It records the trace names, operations, dashboard
naming conventions, and the fields that are useful when investigating the
flow in Sentry.

## Trace catalog

`TraceName` is the transaction name stored by Sentry. The operation describes
the kind of work measured by the trace.

| Trace name                                             | Operation                                               | Emitted at                                                                                                                                                                                                       | What it measures                                                                                                                                                                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Swap View Loaded` (`SwapViewLoaded`)                  | `bridge.screen.performance` (`BridgeScreenPerformance`) | `ui/hooks/bridge/useBridgeNavigation.ts:136-150`; completed or cancelled by `ui/pages/bridge/prepare/prepare-bridge-page.tsx:428-441` and `ui/pages/bridge/index.tsx:98-105`                                     | Time from entering the unified view until the source token, destination token, source balance, and (when an amount was prefilled) the quote surface are ready. Start fields include `entry_point`, `view_mode`, `prefilled_amount`, and available chain IDs. |
| `Swap Quote Fetch` (`SwapQuoteFetch`)                  | `bridge.data_fetch` (`BridgeDataFetch`)                 | Started by `ui/pages/bridge/prepare/prepare-bridge-page.tsx:343-364`; lifecycle helper in `ui/pages/bridge/utils/swap-quote-fetch-trace.ts:49-90`; completed by `ui/hooks/bridge/useQuoteFetchEvents.ts:114-136` | Duration of a debounced quote request or refresh. A replaced request is cancelled. Completion records `success`, `cancelled`, `no_quotes`, or `error`; no-quote and error results also include `no_quote_reason`.                                            |
| `Swap Quotes Fetched` (`SwapQuotesFetched`)            | `bridge.data_fetch` (`BridgeDataFetch`)                 | `ui/store/actions.ts:4889-4901`                                                                                                                                                                                  | Duration of the `fetchAndSetQuotes` background request used by the swap quote flow.                                                                                                                                                                          |
| `Swap Popular Tokens Fetch` (`SwapPopularTokensFetch`) | `bridge.data_fetch` (`BridgeDataFetch`)                 | `ui/pages/bridge/utils/tokens.ts:228-253` via `postWithCache` at `ui/pages/bridge/utils/tokens.ts:118-168`                                                                                                       | Cache-miss latency for the popular-token list request. Fields include `chain_scope` and `chain_ids`; the result is `success`, `error`, or `cancelled`. Cached responses do not create a trace.                                                               |
| `Swap Token Search` (`SwapTokenSearch`)                | `bridge.data_fetch` (`BridgeDataFetch`)                 | `ui/pages/bridge/utils/tokens.ts:314-355` via `postWithCache` at `ui/pages/bridge/utils/tokens.ts:118-168`                                                                                                       | Cache-miss latency for a token search request. Fields include `chain_scope`, `query_length_bucket`, and `result_count_bucket`; the result is `success`, `error`, or `cancelled`. Pagination requests and cached responses do not create a trace.             |
| `Bridge Balances Updated` (`BridgeBalancesUpdated`)    | `bridge.data_fetch` (`BridgeDataFetch`)                 | `ui/ducks/bridge/bridge.ts:83-112`                                                                                                                                                                               | Duration of the source balance read for the selected address and token. The trace includes `srcChainId` and `isNative`, and ends with `success` or `error`.                                                                                                  |

`BridgeViewLoaded` remains declared in `shared/lib/trace.ts`, but it has no
current Swaps/Bridge emitter and is not an active dashboard trace.

## Dashboard panel naming

Panel titles describe the user-facing interaction, not the raw `TraceName`
string. Use these generic titles for shared unified-view traces:

This follows the Mobile Swaps dashboard convention: the core interactions fire
for both same-chain swaps and cross-chain bridges, so their panel titles should
not imply that they belong to only one transaction type.

| Panel title          | Trace(s)                                  |
| -------------------- | ----------------------------------------- |
| Page Load            | `Swap View Loaded`                        |
| Quote Fetch          | `Swap Quote Fetch`, `Swap Quotes Fetched` |
| Popular Tokens Fetch | `Swap Popular Tokens Fetch`               |
| Token Search         | `Swap Token Search`                       |
| Balances Updated     | `Bridge Balances Updated`                 |

Reserve a `Swap` or `Bridge` prefix in a panel title for a trace that is
genuinely transaction-type-specific, such as a future cross-chain-only
destination-polling trace. Do not use the raw trace name as the panel title for
shared Swaps/Bridge interactions.

## Operation naming

Choose an operation by asking what kind of work the trace measures:

- Use `bridge.screen.performance` for screen or view mount-to-visible timing.
- Use `bridge.data_fetch` for API-call or other data-fetch latency.
- Do not create a bespoke operation for each trace name or force a hybrid into
  one of these buckets. A genuinely hybrid flow may use its own operation (for
  example, `bridge.execution`).
- Transaction-type-specific operations use distinct `swap.*` or `bridge.*`
  prefixes, matching the corresponding panel naming.

## Legacy trace-name inconsistency

The existing shared unified-view traces have a known naming wart:
`SwapViewLoaded`, `SwapQuoteFetch`, and `SwapTokenSearch` use the `Swap`
prefix, while `BridgeBalancesUpdated` uses the `Bridge` prefix. These names
are grandfathered and should not be renamed. `TraceName` is the literal
transaction name stored in Sentry, so changing it would break continuity with
historical data. The panel-title convention above keeps the dashboard wording
consistent without changing the stored names.

New trace names should follow the conventions in this document. The newer
`SwapPopularTokensFetch` and `SwapQuotesFetched` names retain their existing
names for the same historical-continuity reason.

## Example Sentry filters

- All Swaps/Bridge data-fetch spans: `op:bridge.data_fetch`
- One quote-fetch trace: `transaction:"Swap Quote Fetch"`
- The view-load trace: `transaction:"Swap View Loaded" op:bridge.screen.performance`
