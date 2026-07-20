# TRAM-3718 — Extension Ramps Order Details Page — Design

**Date:** 2026-07-20
**Ticket:** [TRAM-3718](https://consensyssoftware.atlassian.net/browse/TRAM-3718)
**Epic:** TRAM-3708 (Extension On-ramp)
**Status:** Design — refined from ticket, pending implementation plan

## Summary

The order details page is shown after a user returns from provider checkout in the
native extension buy flow. It renders the result of a ramp buy order in one of three
states — **completed**, **pending**, or **error** — reading order state that has
already been resolved and persisted by the checkout step.

This design **narrows** the original ticket after a code + sibling-ticket review
(see "Reality check" below). The page is a **pure rendering ticket keyed off
persisted order state (`getOrderById`)**. It does not open the checkout tab, does not
watch tabs, does not resolve callbacks, and does not poll.

## Reality check (why this differs from the ticket text)

The ticket was written before its dependencies landed. Code review of the current
`main` (post TRAM-3712) resolves or moves several of its stated open questions:

| Ticket assumption | Actual state |
|---|---|
| `refreshOrder` / `getOrderFromCallback` may need adding to `useRampsOrders` | Both already exist on `useRampsOrders` (plus `addOrder`, `addPrecreatedOrder`, `removeOrder`). |
| Redirect/callback mechanism "not yet decided, blocked" | Mechanism already plumbed: `getRampCallbackBaseUrl()` → `redirectUrl` on quotes → `getOrderFromCallback(providerCode, callbackUrl, wallet)`. Same pattern as mobile. |
| Pending auto-refresh / reactive updates are part of this ticket | Reactive/pending polling is a separate ticket, **TRAM-3719**. This ticket's pending state is a static render. |
| Tab-open + checkout orchestration in scope | Opening the checkout tab and owning the tab-lifecycle watcher belong to **TRAM-3717** ("Select quote page"). |
| Callback resolution (`getOrderFromCallback` → `addOrder`) in this page | TRAM-3717's background watcher resolves + persists the order, then routes here with an `orderId`. This page does **by-id lookup only**. |
| Dedicated "abandoned + retry" state (4th state) | **Deferred to a follow-up** (depends on tab-close detection in the watcher, which isn't built). v1 ships 3 states. |

Mobile parity reference: `app/components/UI/Ramp/Views/OrderDetails/{OrderDetails,OrderContent}.tsx`
in metamask-mobile. Layout and field formatting are near-direct parity; the callback
and polling machinery in mobile's `OrderDetails.tsx` is explicitly out of scope here
(owned by 3717 / 3719).

## Decisions

- **View context:** No forced view. The page is the same UI bundle in popup, side
  panel, and fullscreen, and renders identically in all three. The persistent-return
  problem is solved in TRAM-3717 by a **background service-worker** watcher (works
  regardless of UI surface, survives popup close). Chrome side panel
  (`ENVIRONMENT_TYPE_SIDEPANEL`, default-on) gives a live return experience for free;
  popup/Firefox users see the persisted order on next open. This page needs no
  side-panel- or fullscreen-specific code.
- **Entry mode:** by-id only. `getOrderById(orderId)` from Redux (scoped to the
  selected account group by the hook).
- **Error retry:** re-fetch (mobile parity) — `refreshOrder(providerCode, orderCode,
  walletAddress)`, which maps to the controller's `getOrder`.
- **Abandoned state:** deferred to a follow-up ticket.

## Scope

### In scope
- New route `RAMPS_ORDER_DETAILS_ROUTE = '/ramps/order-details/:orderId'`.
- Container + content components rendering completed / pending / error.
- Done and Close both return to wallet overview.
- Unit + snapshot tests for the three states.

### Out of scope
- Opening the checkout tab / consuming `BuyWidget.url` (TRAM-3717).
- Tab-lifecycle watcher: `chrome.tabs.onUpdated` callback match, `chrome.tabs.onRemoved`
  abandonment (TRAM-3717, background service worker).
- Callback resolution `getOrderFromCallback` → `addOrder` (TRAM-3717).
- Pending polling / reactive auto-refresh (TRAM-3719).
- Dedicated abandoned/retry state and its 4th-state tests (follow-up ticket).
- Ramp orders in activity page (TRAM-3720).
- Notification/badge for pending orders elsewhere (YAGNI for v1).

## Dependencies
- **TRAM-3712** (Done) — `useRampsOrders` (`getOrderById`, `refreshOrder`).
- **TRAM-3717** (To Do) — resolves + persists the order in the background and routes
  to `/ramps/order-details/:orderId`. This page is only reachable/meaningful once 3717
  routes into it, but the page can be built and tested independently against Redux
  state.

## Architecture

### Route
- Add `RAMPS_ORDER_DETAILS_ROUTE = '/ramps/order-details/:orderId'` to
  `ui/helpers/constants/routes.ts` (alongside the existing `RAMPS_*` routes).
- Register the page in `ui/pages/routes` following the existing `/ramps/*` route
  registration pattern.

### Components
```
ui/pages/ramps/order-details/
  order-details.tsx        # container: resolve order, choose state, header, Done/Close
  order-details.test.tsx
  __snapshots__/
  components/
    order-content.tsx      # field layout for a resolved order
    order-content.test.tsx
  index.ts
```

- **`order-details.tsx`** (container)
  - Reads `orderId` from the route param.
  - `const { getOrderById, refreshOrder } = useRampsOrders()` (via `useRampsController`
    or the sub-hook directly, matching how sibling ramps pages consume it).
  - `const order = getOrderById(orderId)`.
  - State selection:
    - **Error:** local `error` string is set (from a failed retry `refreshOrder`), OR
      `!order` (order not found / failed to load).
    - **Data:** `order` present → render `OrderContent`, choosing pending vs completed
      styling by status group.
  - Header with title and a back/close affordance. Done and Close both navigate to the
    wallet overview route.
  - Retry handler: `refreshOrder(normalizeProviderCode(order.provider.id),
    order.providerOrderId, order.walletAddress)`; on throw, set `error`.

- **`order-content.tsx`**
  - Props: `{ order: RampsOrder }`.
  - Status grouping helpers (parity with mobile):
    - pending group = `{ Pending, Created, Precreated, Unknown }` → warning color +
      "may take time to confirm" message + per-field skeletons for unresolved amounts.
    - terminal group = `{ Completed, Failed, Cancelled, IdExpired }`.
  - Fields (completed/terminal):
    - Token header: crypto icon (`cryptoCurrency.iconUrl`) with a network badge
      (`network.chainId`); large crypto amount + symbol.
    - Status: colored status text; **View on {provider}** link when
      `order.providerOrderLink` is present.
    - Order ID: shortened display, **click-to-copy the full `providerOrderId`**.
    - Date and time: `order.createdAt` formatted with the extension's date helper.
    - Fees: `order.totalFeesFiat`, currency-formatted via `fiatCurrency.symbol` /
      `fiatCurrency.decimals ?? 2`.
    - Total: `order.fiatAmount`, same currency formatting.

### Data flow
Redux (persisted order state, updated by the controller / 3717) → `getOrderById` →
container picks state → `OrderContent` renders. Retry is the only write path and calls
`refreshOrder` (background `getOrder`) directly; the page does not otherwise fetch.

## Order type reference (`@metamask/ramps-controller`)
`RampsOrder` fields used: `providerOrderId`, `providerOrderLink`, `status`, `createdAt`,
`cryptoAmount`, `fiatAmount`, `totalFeesFiat`, `cryptoCurrency` ({ symbol, iconUrl,
decimals, chainId }), `fiatCurrency` ({ symbol, decimals }), `network` ({ name,
chainId }), `provider` ({ id, name }), `walletAddress`.
`RampsOrderStatus` enum: `Unknown | Precreated | Created | Pending | Failed | Completed
| Cancelled | IdExpired`.

## Error handling
- **Order not found** (`getOrderById` returns `undefined`): error state with retry.
  Retry attempts `refreshOrder`; if it still can't resolve, remain in error state.
- **Retry fetch fails** (`refreshOrder` throws): set `error` to the thrown message,
  render error state with the retry button available again.
- No callback errors here — callback resolution is 3717.

## Testing
- **Unit tests** (`order-details.test.tsx`, `order-content.test.tsx`): completed,
  pending, and error states; Done/Close navigation to wallet overview; copy-order-id
  writes the full id; View-on-provider link renders only when `providerOrderLink` is
  set; retry calls `refreshOrder` and surfaces its error.
- **Snapshot tests**: completed, pending, error.
- Mock `useRampsOrders` / `useRampsController` per the existing ramps page test pattern.

## Follow-ups (not this ticket)
- Abandoned/retry state + tab-close detection (new follow-up, depends on 3717 watcher).
- Reactive pending updates / polling (TRAM-3719).
- Ramp orders in activity page (TRAM-3720).
