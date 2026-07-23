# Ramps redirect-flow order resolution (foreground implementation)

## Problem

`useRampsBuildQuote.ts`'s `handleContinue` only resolves/tracks an order when
the provider's buy-widget response precreates one (`widget.orderId` present).
Providers using the classic redirect/checkout flow (`features.buy.redirection
=== 'JSON_REDIRECTION'` — e.g. Transak, Banxa, `mockprovider`) never return an
`orderId` up front; the real order only exists once the user finishes
checkout on the provider's hosted page and it navigates to our
`fake-callback` URL (`getRampCallbackBaseUrl()`). Before this change, nothing
happened after the checkout tab opened for these providers: no order was
created client-side, and the user was never routed to order-details.

## Chosen approach: foreground hook, not a background service

Implemented entirely inside `useRampsBuildQuote.ts`, using the same
`global.platform` tab primitives the hook already calls for `openTab`:

- On `handleContinue`, when `widget.orderId` is absent, register
  `platform.addTabUpdatedListener` / `addTabRemovedListener` scoped to the
  opened tab's id.
- On a URL update matching `getRampCallbackBaseUrl()`, tear down the
  listeners, close the tab, call `getOrderFromCallback(providerCode,
  callbackUrl, walletAddress)`, then navigate to
  `RAMPS_ORDER_DETAILS_ROUTE`.
- On tab removal without a match, tear down listeners silently (user
  cancelled checkout — not an error).
- Listeners are also torn down on hook unmount via a ref-held cleanup
  function, to avoid leaks/stale-closure state updates if the user
  navigates away inside the extension before checkout completes.

This mirrors two existing patterns in the codebase that already do
"open tab → watch via `tabs.onUpdated`/`onRemoved` → act on URL match":
`app/scripts/services/oauth/oauth-service.ts` (`#launchTabAuthFlow`) and
`app/scripts/services/subscription/subscription-service.ts`
(`#openAndWaitForTabToClose`) — both of those live in **background** service
classes, not foreground hooks.

## Why foreground, and the resulting gap

The foreground approach was chosen because it needed zero new plumbing:
`getOrderFromCallback` is already exposed via `useRampsController()`, and
`global.platform`'s tab-watching methods are already used from this same UI
context for `openTab`. The alternative — a background service mirroring
`subscription-service.ts` — would require a new service class, background
wiring, and a mechanism to push the resolved order/navigation back to the
open UI (since the background can't call `navigate()` on a mounted React
component; it can only update controller state, which the UI would then
need to detect and react to).

**The trade-off:** this implementation's listeners live only as long as
`useRampsBuildQuote`'s component is mounted. If the user closes the
MetaMask popup/tab (or navigates elsewhere in the extension) before the
provider's checkout tab redirects to the callback URL, the listeners are
torn down with the component, and the order is **never created
client-side** for that redirect-flow purchase. Unlike the precreated-order
path, there's no background polling fallback here, because there's no order
in state to poll yet — polling only starts once an order exists.

## Future work: background version

If real users hit this gap (background/popup closed mid-checkout), the fix
is to move the tab-watching into a background service, following
`subscription-service.ts`'s structure:

1. A new small service (or an addition to an existing ramps background
   init file) owns the tab-watch lifecycle instead of the React hook,
   keyed by the opened tab id and provider code/wallet address needed for
   `getOrderFromCallback`.
2. On successful resolution, the background calls
   `RampsController.getOrderFromCallback` directly (already how the UI
   action `getRampsOrderFromCallback` gets there) and lets the order land
   in persisted/shared controller state — the same state
   `selectRampsOrdersForSelectedAccount` already reads.
3. The **open question** this design doesn't answer: how does the UI know
   to navigate to order-details once the background resolves the order,
   if the user isn't sitting on the build-quote screen anymore? Options to
   evaluate at that point: a MetaMask notification linking into
   order-details, or (longer term) an orders-list screen the user can
   check manually instead of relying on auto-navigation at all — note that
   today there is **no orders-list screen**; `RAMPS_ORDER_DETAILS_ROUTE` is
   only ever reached via the auto-navigate call in this hook.

This is deferred rather than built now because it adds a new background
service, cross-context state-to-navigation plumbing, and a UX decision
(notification vs. orders list) that doesn't have an answer yet — worth
scoping as its own piece of work once the foreground version's gap is
confirmed to matter in practice.
