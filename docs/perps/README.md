# Perps in the Extension

The Extension perps layer is the UI side of Perps. It sends requests to the `PerpsController` in the background and caches the streams the background pushes back.

Shared logic (controller, providers, math, formatting, events, flags) is documented in Core: [perps-controller docs](https://github.com/MetaMask/core/blob/main/packages/perps-controller/docs/README.md).

## Pieces

| Piece                      | Path                                                      | What it does                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PerpsStreamManager`       | `ui/providers/perps/PerpsStreamManager.ts`                | Module-level singleton. Holds the stream channels, sends the init and preload requests, takes background stream updates.                                             |
| `PerpsDataChannel`         | `ui/providers/perps/PerpsDataChannel.ts`                  | Cached channel. Gives new subscribers the cached value at once and keeps the cache after the last one leaves.                                                        |
| `CandleStreamChannel`      | `ui/providers/perps/CandleStreamChannel.ts`               | Candle cache per symbol and interval. Activates and deactivates the background candle stream.                                                                        |
| `perps-cache.ts`           | `ui/providers/perps/perps-cache.ts`                       | Module caches for market info (5 min) and order fills (30 s).                                                                                                        |
| `PerpsAttributionContext`  | `ui/providers/perps/PerpsAttributionContext.tsx`          | UTM and source attribution for Perps screen views.                                                                                                                   |
| Mock controller            | `ui/providers/perps/getPerpsController.mock.ts`           | Mock `getPerpsController`, still exported from the providers index. Nothing outside the providers folder imports it.                                                 |
| Pages                      | `ui/pages/perps/`                                         | Layout, home (Perps tab), market list, market detail, order entry, activity, transaction details, withdraw.                                                          |
| `PerpsLayout`              | `ui/pages/perps/perps-layout.tsx`                         | Wraps the Perps routes. Marks the view active, seeds channels from the controller cache, checks socket health on return to the tab.                                  |
| Stream hooks               | `ui/hooks/perps/stream/`                                  | `usePerpsStreamManager`, `usePerpsChannel` and one `usePerpsLive*` hook per channel.                                                                                 |
| `usePerpsPreload`          | `ui/hooks/perps/usePerpsPreload.ts`                       | Wallet-root preload. Starts and stops the background preload for the selected EVM account.                                                                           |
| `usePerpsViewActive`       | `ui/hooks/perps/stream/usePerpsViewActive.ts`             | Tells the background a Perps view is open or closed.                                                                                                                 |
| Order and fee hooks        | `ui/hooks/perps/`                                         | `usePerpsOrderForm` (order form state), `usePerpsOrderFees` (calls `perpsCalculateFees`), `usePerpsMarketInfo`, `usePerpsMarketFills`, `usePerpsTransactionHistory`. |
| Perps tab                  | `ui/components/app/perps/perps-tab.tsx`, `perps-view.tsx` | Account overview tab. Positions, orders, account and explore sections.                                                                                               |
| Position and order actions | `ui/components/app/perps/`                                | `position-card`, `order-card`, `close-position`, `reverse-position`, `edit-margin`, `update-tpsl`, `cancel-order`.                                                   |
| Trading                    | `ui/components/app/perps/`                                | `order-entry`, `order-book`, `slippage-config`, `perps-candlestick-chart`, `perps-chart-content`.                                                                    |
| Markets                    | `ui/components/app/perps/`                                | `market-row`, `perps-market-categories`, `perps-explore-markets`, `perps-top-movers`, `perps-watchlist`.                                                             |
| Activity                   | `ui/components/app/perps/`                                | `transaction-card`, `perps-recent-activity`, `perps-market-recent-activity`.                                                                                         |
| Notices                    | `ui/components/app/perps/`                                | `perps-toast`, `perps-geo-block-modal`, `perps-service-interruption-banner`, `perps-tutorial-modal`.                                                                 |

## Docs here

| Doc                                                        | What it covers                                                                          |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [connection-architecture.md](./connection-architecture.md) | How the UI reaches the controller, lifecycle requests, stream channels, caches, cleanup |

Code: `ui/providers/perps/index.ts`; `ui/hooks/perps/stream/index.ts`; `ui/hooks/perps/index.ts`; `ui/pages/perps/index.ts`; `ui/components/app/perps/index.ts`.
