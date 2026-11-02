# Account list route baseline

Raw request log: [account-list-route-baseline.json](./account-list-route-baseline.json)

Measured before the dialog change. Gesture: Home is already quiet, click the account name, land on `/account-list`, go back without switching accounts.

## Conditions

- Fresh one-account SRP wallet, zero balances
- Many networks enabled (Ethereum, Linea, Base, Arbitrum, BSC, Optimism, Polygon, Monad, and others)
- Home had already finished its first load and the network had been idle
- Dev build of this branch, Playwright, no mock proxy
- Paths with long ids are redacted (`:id`, `:hex`)

This is a lower bound. A vault with many accounts should scale the account-list work (balance refresh, account rows) with account count and enabled chains. The Home token-list re-render on the way back scales with visible tokens, not with how many accounts were opened.

## Gesture, after Home was idle

|                                 | Open Accounts | Close without switching |
| ------------------------------- | ------------- | ----------------------- |
| Time in the window              | 1574ms        | 1636ms                  |
| HTTP calls                      | 0             | 2                       |
| WebSocket subscriptions         | none          | none                    |
| React commits                   | 5             | 12                      |
| `MultichainAccountList` renders | 2             | 0                       |
| `TokenCell` renders             | 0             | 156                     |
| `CoinOverview` renders          | 0             | 12                      |
| Long tasks                      | 0             | 1 (52ms)                |

The only HTTP calls on close were `GET https://authentication.api.cx.metamask.io/api/v2/profile/lineage` (2). No Infura and no accounts balance call. The balance controller did not repeat the fetch Home had just finished.

No product WebSocket opened or closed. One dev-server socket to `ws://localhost:8080/ws` showed up on close and sent no frames.

## Home first load (what a cold remount can repeat)

Counted in the same session, before the gesture, while Home was still starting. 94 React commits, 619ms of long tasks, 148 HTTP calls. Largest groups:

| Calls  | Request                                                                |
| ------ | ---------------------------------------------------------------------- |
| 18     | `POST https://api.hyperliquid.xyz/info`                                |
| 7      | `GET https://price.api.cx.metamask.io/v3/spot-prices`                  |
| 6      | `POST https://mainnet.infura.io/v3/:id`                                |
| 4      | `GET https://authentication.api.cx.metamask.io/api/v2/profile/lineage` |
| 4      | `POST https://notification.api.cx.metamask.io/api/v4/notifications`    |
| 3      | `GET https://tokens.api.cx.metamask.io/v3/assets`                      |
| 3      | `POST https://monad-mainnet.infura.io/v3/:id`                          |
| 2 each | Infura on Linea, Base, Arbitrum, BSC, Optimism, Polygon                |

This warm close did not repeat that set. A cold open of `/account-list` that unmounts Home, or a back navigation after those caches expire, is the case that can pay it again.
