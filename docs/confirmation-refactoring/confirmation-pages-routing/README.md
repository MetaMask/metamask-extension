# Refactoring - Confirmation pages routing

This document details how routing to confirmation pages is currently done and the proposed improvements in routing.

## Current flow

The current flow of routing to confirmation pages is un-necessarily complicated and have issues.

![Confirmation Pages Routing - Current](https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/docs/confirmation-refactoring/confirmation-pages-routing/current.png)

- There are 2 ways in which confirmation pages can be opened:
  1. User triggers send flow from within Metamask
     - If the user triggers the send flow from within MetaMask and selects the recipient and amount on the send screen, an unapproved transaction is created in the background and the user is redirected to the **`/confirm-transaction`** route.
  2. DAPP sends request to Metamask
     - If DAPP sends request to Metamask an unapproved transaction or signature request is created in background and UI is triggered open (if it is not already open).
     - The router by default renders `pages/home` component. The component looks at the state and if it finds an unapproved transaction or signature request in state it re-routes to **`/confirm-transaction`**.
- For **`/confirm-transaction/`** route, the router renders `pages/confirm-transaction` component.
- For **`/confirm-transaction`** route `pages/confirm-transaction` component renders `pages/confirm-transaction-switch` by default, for transactions with token methods it renders `pages/confirm-transaction/confirm-token-transaction-switch` which also open `pages/confirm-transaction-switch` by default.
- `pages/confirm-token-switch` redirect to specific confirmation page route depending on un-approved transaction or signature request in the state.
- For specific route **`/confirm-transaction/${id}/XXXXX`** routes again `pages/confirm-transaction` is rendered.
- Depending on confirmation route `pages/confirm-transaction` and `pages/confirm-transaction/confirm-token-transaction-switch` renders the specific confirmation page component.

## Proposed flow

The proposed routing of confirmation pages looks like.

![Confirmation Pages Routing - Proposed](https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/docs/confirmation-refactoring/confirmation-pages-routing/proposed.png)

- There are 2 ways in which confirmation pages can be opened:
  1. User triggers send flow from within Metamask
     - If the user triggers the send flow from within MetaMask and selects the recipient and amount on the send screen, an unapproved transaction is created in the background and the user is redirected to a specific transaction route, **`/confirm-transaction/${id}/XXXX`**, depending on the transaction type.
  2. DAPP sends request to Metamask
     - If DAPP send request to Metamask an unapproved transaction or signature request is created in background and UI is triggered to open (if it is not already open).
     - Instead of rendering `pages/home`, `pages/routes` finds the unapproved transaction in state and reroutes to **`/confirm-transaction`**.
- Router renders `pages/confirm-transaction` component for **`/confirm-transaction`** route.
- `pages/confirm-transaction` component redirect to specific confirmation page route depending on unapproved transaction or signature request in the state.
- Again for specific route **`/confirm-transaction/${id}/XXXXX`** `pages/confirm-transaction` is rendered, it in-turn renders appropriate confirmation page for the specific route.

## Current Route component mapping

| Route                                             | Component                              |
| ------------------------------------------------- | -------------------------------------- |
| `/confirm-transaction/${id}/deploy-contract`      | `pages/confirm-deploy-contract`        |
| `/confirm-transaction/${id}/send-ether`           | `pages/confirm-send-ether`             |
| `/confirm-transaction/${id}/send-token`           | `pages/confirm-send-token`             |
| `/confirm-transaction/${id}/approve`              | `pages/confirm-approve`                |
| `/confirm-transaction/${id}/set-approval-for-all` | `pages/confirm-approve`                |
| `/confirm-transaction/${id}/transfer-from`        | `pages/confirm-token-transaction-base` |
| `/confirm-transaction/${id}/safe-transfer-from`   | `pages/confirm-token-transaction-base` |
| `/confirm-transaction/${id}/token-method`         | `pages/confirm-contract-interaction`   |
| `/confirm-transaction/${id}/signature-request`    | `pages/confirm-signature-request.js`   |

## Areas of code refactoring

Current routing code is complicated, it is also currently tied to state change in confirmation pages that makes it more complicated. State refactoring as discussed in this [document](https://github.com/MetaMask/metamask-extension/tree/develop/docs/confirmation-refactoring/confirmation-state-management) will also help simplify it.

- Any re-usable routing related code should be moved to [useRouting](https://github.com/MetaMask/metamask-extension/blob/develop/ui/hooks/useRouting.js) hook.
- Logic to initially check state and redirect to `/pages/confirm-transaction` can be moved from `/pages/home` to `pages/routes`
- All the route mapping code should be moved to `/pages/confirm-transaction`, this will require getting rid of route mappings in `/pages/confirm-transaction/confirm-token-transaction-switch`, `/pages/confirm-transaction-switch`.
- `/pages/confirm-transaction-switch` has the code that checks the un-approved transaction / message in the state, and based on its type and asset redirect to a specific route, a utility method can be created to do this mapping and can be included in `/pages/confirm-transaction` component.
- During the send flow initiated within metamask user can be redirected to specific confirmations route **`/confirm-transaction/${id}/XXXX`**
- Confirmation components have lot of props passing which needs to be reduced. Values can be obtained from redux state or other contexts directly using hooks. Component [confirm-token-transaction-switch](https://github.com/MetaMask/metamask-extension/blob/develop/ui/pages/confirm-transaction/confirm-token-transaction-switch.js) has a lot of un-necessary props passing which should be removed and will help to further refactor routing.

- **Routing to mostRecentOverviewPage**
  Across confirmation pages there is code to re-direct to `mostRecentOverviewPage`. `mostRecentOverviewPage` is equal to default route `/` or `/asset` whichever was last opened.
  Also a lot of components check for state update and as soon as state has `0` pending un-approved transaction or signature request redirect is done to `mostRecentOverviewPage`. This logic can be handled at `/pages/confirm-transaction` which is always rendered for any confirmation page.
  Also when the transaction is completed / rejected redirect is done to `mostRecentOverviewPage` explicitly which we should continue to do.
