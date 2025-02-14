# Token List Performance PR Notes.

# Problem

Currently we have optimized re-renders of the token list. However there are 2 things that are still a cause for concern:

- **Initial Render performance** - if there is a lot of tokens in the list, then we need to render all of these token components.
- **Balance updates** - we use a `TokenTracker` which takes an array of tokens and polls to then update balance. Polling and updating all of these tokens is expensive!

## Task 1 - Virtualizing the list

Lets try to virtualize the token list, so we only need to render tokens in the viewport.

- So instead of rendering 100s of tokens, we only render (e.g.) 20 tokens.

This should improve initial rendering, and also re-renders on token balance updates.

Cons:

- List virtualization does mean that finding (cmd + f) is not possible as tokens not visible in the viewport will not have rendered DOM nodes.
  - We may need to introduce a way to filter or find tokens in some views.

## Task 2 - Only call balance updates for tokens in the viewport

We have 2 instances of `useTokenTracker` in the codebase:

- `useTokenTracker.js`
- `useTokenBalances.ts` which exposes a similarly named hook.

`useTokenBalances.ts` impl replaces the RPC calls by instead reading state from the `TokenBalancesController`.
**IMO this is a much more preferred hook and is already used to optimism some asset components and the accounts list**

### Places that use the old `useTokenTracker.js`

Places that track a single token:

- `asset-balance-text.tsx`
- `token-balance.js`;
- `token-asset.tsx`;
- `useAssetDetails.js` (which is used in a few places)
  - `approve-static-simulation.tsx`
  - `approve.tsx`
  - `edit-spending-cap-modal.tsx`
  - `spending-cap.tsx`
  - `use-token-values.ts`
  - `nft-send-heading.ts`
  - `useCurrentSpendingCap.ts`

Places that track multiple tokens:

- `asset-picker-modal.tsx`
- `prepare-swap-page.js`
- `review-quote.js`

### Implementation

The task was to optimize the Account Menu Items, however this has already been optimized by using the new `useTokenBalances.ts - useTokenTracker()` hook.

We can still have some wins by either creating a strategy to unify the use of the new `useTokenTracker()` calls, or by virtualizing the accounts list to minimize items to render.
