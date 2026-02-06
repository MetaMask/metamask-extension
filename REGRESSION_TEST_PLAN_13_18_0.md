# Regression Test Plan – Release 13.18.0

**Release Version:** 13.18.0  
**Scope:** All changes from changelog including Swaps, Assets, Perps/Trade, Hardware Wallets, Connections, Shield, NFTs, and Performance fixes  
**Environment:** Extension in popup, sidepanel, and full window. Chrome (MV3) primary; Firefox (MV2) as needed.  
**Date:** 2026-02-06

---

## Table of Contents

1. [Swaps](#swaps)
2. [Assets Core (Mobile UX)](#assets-core-mobile-ux)
3. [Perps / Trade](#perps--trade)
4. [Hardware Wallets](#hardware-wallets)
5. [Dapp Connections](#dapp-connections)
6. [Shield](#shield)
7. [NFTs](#nfts)
8. [Network & Gas](#network--gas)
9. [Snaps](#snaps)
10. [Performance & UI](#performance--ui)
11. [Security & Privacy](#security--privacy)
12. [Cross-Cutting Tests](#cross-cutting-tests)

---

## Swaps

### SWAP-01 – Restore quote only in popup mode

| Field | Value |
|-------|--------|
| **ID** | SWAP-01 |
| **Priority** | High |
| **PR** | #39654 |
| **Why Test** | This fix ensures swap quotes are only restored in popup mode, not in full window. This prevents state persistence issues and ensures users get fresh quotes when using full window mode. |

**Preconditions**

- Wallet unlocked, balance on a swap-supported network (e.g. Mainnet).
- Extension can be opened as popup and as full window.

**Steps**

1. Open extension as **popup** (toolbar icon).
2. Go to Swap. Select source token, destination token, and enter amount.
3. Wait for quote to load. Note the receive amount (or quote ID).
4. Close the popup (click outside or close tab).
5. Re-open the extension as popup and go to Swap again.
6. **Expected:** Same from/to/amount and quote are restored; receive amount matches (or is refreshed from same params).
7. Open extension in **full window** (e.g. "Open in full window" or open in tab).
8. Go to Swap, select tokens and amount, get quote.
9. Navigate away (e.g. Home) or close the tab, then open Swap again.
10. **Expected:** Quote is **not** restored; user sees empty/default swap form.

**Pass criteria:** Quote restores only in popup; full window does not restore quote.

---

### SWAP-02 – MM fee disclaimer visibility (feeData)

| Field | Value |
|-------|--------|
| **ID** | SWAP-02 |
| **Priority** | High |
| **PR** | #39653 |
| **Why Test** | Users need clear visibility when MetaMask charges a fee. This ensures the disclaimer only appears when there's an actual fee, preventing confusion when fees are zero. |

**Preconditions**

- Wallet unlocked on a network where swaps have MetaMask fee (e.g. Mainnet).
- Ability to get a quote that includes MM fee and one that has zero MM fee (if available).

**Steps**

1. Go to Swap. Select source and destination tokens and amount; get quote.
2. If the quote includes a non-zero MetaMask fee: **Expected** – Disclaimer/text indicating MM fee is visible (e.g. "Includes MetaMask fee", "Swap includes MM fee", or similar in fee card).
3. If possible, obtain a quote where MM fee is zero (e.g. certain pairs or promos): **Expected** – MM fee disclaimer is hidden or not emphasized for that quote.
4. Change amount or tokens to get a new quote; **Expected** – Disclaimer visibility updates according to new quote's feeData (shown when fee > 0, hidden when 0).
5. Repeat in **popup** and in **full window**; **Expected** – Same logic in both.

**Pass criteria:** MM fee disclaimer is shown only when feeData indicates a non-zero MM fee; hidden when fee is zero.

---

### SWAP-03 – Swap activity in token details page

| Field | Value |
|-------|--------|
| **ID** | SWAP-03 |
| **Priority** | High |
| **PR** | #39753 |
| **Why Test** | Users need to see all their swap transactions in token details. This fix ensures swaps are not missing from the activity list, which was a bug affecting user visibility of their transaction history. |

**Preconditions**

- Wallet with at least one completed swap (source or destination token still in wallet).

**Steps**

1. Note the token that was "from" or "to" in the swap.
2. From Home, open that token's detail page (click token in list).
3. Scroll to Activity / transaction list.
4. **Expected:** The swap transaction appears in the list with correct type (e.g. "Swap"), amount, date, and status.
5. Repeat for the other token (destination/source) of the same swap; **Expected** – Swap appears there as well with correct direction/amount.
6. Perform a **new** swap, wait for confirmation, then open detail of source and destination tokens; **Expected** – New swap appears in both token activity lists.

**Pass criteria:** All swaps appear in the activity section of both the source and destination token detail pages with correct data.

---

### SWAP-04 – Selected swap asset at top of list (13.17)

| Field | Value |
|-------|--------|
| **ID** | SWAP-04 |
| **Priority** | Medium |
| **PR** | #39542 |
| **Why Test** | UX improvement: selected tokens should appear at the top of the list for quick access and better user experience. |

**Preconditions**

- Wallet with multiple tokens on a swap-supported network.

**Steps**

1. Go to Swap. Open the **source** token selector (e.g. "Select token").
2. Select a token that is not the first in the list (e.g. USDC).
3. Close the selector. Re-open the source token selector.
4. **Expected:** The currently selected token (e.g. USDC) appears at the **top** of the list.
5. Repeat for **destination** token selector; **Expected** – Selected destination token appears at top when list is opened.

**Pass criteria:** In both from and to selectors, the currently selected asset is shown at the top of the list.

---

### SWAP-05 – Full swap flow in popup (no state loss)

| Field | Value |
|-------|--------|
| **ID** | SWAP-05 |
| **Priority** | High |
| **Why Test** | Ensures swap state persists correctly in popup mode during the full transaction flow, preventing user frustration from lost progress. |

**Preconditions**

- Wallet unlocked, balance on swap-supported network. Extension as popup.

**Steps**

1. Open popup → Swap. Select from token, to token, amount; wait for quote.
2. Click "Swap" / "Review" to go to confirmation.
3. Before signing: minimize or blur popup (e.g. click page), then open popup again.
4. **Expected:** User remains on review/confirmation screen (or returns to it); quote/params not lost.
5. Sign the transaction. **Expected:** Success/awaiting screen and then completion; swap completes.
6. Open Activity or token details; **Expected:** Swap transaction is present and correct.

**Pass criteria:** No unexpected loss of swap state during review in popup; swap completes and appears in activity.

---

### SWAP-06 – Bridge getToken response caching

| Field | Value |
|-------|--------|
| **ID** | SWAP-06 |
| **Priority** | Medium |
| **PR** | #39541 |
| **Why Test** | Caching bridge token responses improves performance and reduces API calls. Verify that cached data is used appropriately and refreshed when needed. |

**Preconditions**

- Wallet with bridge access enabled.
- Network connection available.

**Steps**

1. Navigate to Bridge feature.
2. Select source and destination networks.
3. Open token selector and select a token.
4. **Expected:** Token data loads (name, symbol, balance, etc.).
5. Close token selector and reopen it.
6. **Expected:** Token data loads faster (from cache) and is still accurate.
7. Switch networks and back; **Expected:** Cache is invalidated/refreshed appropriately.
8. Perform a bridge transaction; **Expected:** Token data updates correctly after transaction.

**Pass criteria:** Bridge token responses are cached and improve load times while maintaining data accuracy.

---

## Assets Core (Mobile UX)

### ASSET-01 – Asset list control bar – close/filter buttons clickable area

| Field | Value |
|-------|--------|
| **ID** | ASSET-01 |
| **Priority** | High |
| **PR** | #39823 |
| **Why Test** | Mobile UX fix: increased clickable area prevents mis-taps and improves usability on small screens. This is critical for popup and sidepanel usage. |

**Preconditions**

- Wallet with tokens. Extension in **popup** and in **sidepanel** (or narrow window).

**Steps**

1. Open Home → Tokens tab. Locate the asset list control bar (network selector, sort, import, etc.).
2. If there is a filter/sort open: use the **close** control (X or "Close") to dismiss. **Expected:** Closes on first tap; no need to tap exactly on the icon (larger hit area).
3. In **popup** (small width): open network dropdown or sort, then close it using the close/back control. **Expected:** Easy to tap; no mis-taps on adjacent elements.
4. In **sidepanel** (or narrow window): repeat step 3. **Expected** – Same behavior; controls remain easily tappable.
5. Verify no overlapping touch targets (e.g. two buttons that both fire on one tap). **Expected:** Only the intended control responds.

**Pass criteria:** Close and filter controls in the asset list control bar have increased clickable area and work correctly in popup and sidepanel.

---

### ASSET-02 – Token details page – activity list complete

| Field | Value |
|-------|--------|
| **ID** | ASSET-02 |
| **Priority** | High |
| **PR** | #39753 |
| **Why Test** | Critical bug fix: ensures all token transactions (sends, receives, swaps) are visible in token details. Missing activity affects user trust and transaction tracking. |

**Preconditions**

- Wallet with a token that has multiple activity types: at least one send, one receive, and one swap (if possible).

**Steps**

1. From Home, open the detail page of that token.
2. Scroll to the Activity / transaction list.
3. **Expected:** All known transactions (sends, receives, swaps) for that token appear; none missing.
4. Compare with Activity tab (all networks or same network): **Expected** – Count and types of tx for this token match.
5. Repeat for 2–3 different tokens (different networks if applicable). **Expected** – No missing activity on any.

**Pass criteria:** Token details activity list shows all transactions for that token; no missing swap/send/receive.

---

### ASSET-03 – Asset list and token details layout in popup/sidepanel

| Field | Value |
|-------|--------|
| **ID** | ASSET-03 |
| **Priority** | Medium |
| **Why Test** | Ensures responsive design works correctly in constrained viewports. Layout issues can make the extension unusable on mobile or in popup mode. |

**Preconditions**

- Extension in popup and in sidepanel (or resized to ~400px width).

**Steps**

1. Open Home → Tokens. **Expected:** List is readable; no horizontal scroll; control bar fully visible and usable.
2. Open a token detail page. **Expected:** Header (name, balance), chart/placeholder, Send/Swap/Buy (or equivalent), and activity section are all visible and laid out correctly; no horizontal overflow.
3. Scroll token details page. **Expected:** Smooth scroll; no content cut off at bottom; sticky header (if any) behaves correctly.
4. Back to token list. **Expected:** List renders correctly; no layout shift or overlap.

**Pass criteria:** No horizontal overflow or broken layout on asset list and token details in popup and sidepanel.

---

### ASSET-04 – Navigation: token list ↔ token detail

| Field | Value |
|-------|--------|
| **ID** | ASSET-04 |
| **Priority** | Medium |
| **Why Test** | Navigation consistency is important for user experience. Users should be able to navigate back and forth without losing context. |

**Steps**

1. Home → Tokens. Scroll down the token list (e.g. 5–10 tokens).
2. Open a token in the middle of the list (tap/click). **Expected:** Token detail opens.
3. Use Back. **Expected:** Returns to token list; scroll position is reasonable (e.g. list is not reset to top arbitrarily; optional: list restores near same token).
4. Open another token, then Back. **Expected:** Same behavior.
5. From token detail, use browser/extension Back if available. **Expected:** Same as in-app Back (back to list).

**Pass criteria:** Back from token detail returns to token list with consistent, predictable behavior.

---

### ASSET-05 – Activity Log header arrow disclosure variant

| Field | Value |
|-------|--------|
| **ID** | ASSET-05 |
| **Priority** | Low |
| **PR** | #39767 |
| **Why Test** | UX consistency improvement: arrow disclosure variant provides better visual consistency with other expandable sections in the app. |

**Preconditions**

- Wallet with transaction history.

**Steps**

1. Navigate to Activity tab or token details activity section.
2. Locate the Activity Log header.
3. **Expected:** Header uses arrow disclosure variant (arrow icon that indicates expand/collapse) instead of previous variant.
4. If collapsible: click to expand/collapse. **Expected:** Arrow animates/rotates correctly.
5. Verify visual consistency with other disclosure headers in the app. **Expected:** Matches design system.

**Pass criteria:** Activity Log header uses arrow disclosure variant and behaves consistently.

---

### ASSET-06 – Static assets polling controller

| Field | Value |
|-------|--------|
| **ID** | ASSET-06 |
| **Priority** | Medium |
| **PR** | #39448 |
| **Why Test** | New controller for polling static assets. Verify it works correctly and doesn't cause performance issues or unnecessary network calls. |

**Preconditions**

- Wallet with assets on multiple networks.

**Steps**

1. Open Home → Tokens.
2. **Expected:** Assets load and display correctly.
3. Wait 30-60 seconds (polling interval).
4. **Expected:** Assets refresh/update if there are changes (new tokens, balance updates).
5. Switch networks and back. **Expected:** Polling continues correctly.
6. Check browser network tab (if possible). **Expected:** Polling requests are made at appropriate intervals, not too frequently.
7. Lock wallet and unlock. **Expected:** Polling resumes correctly.

**Pass criteria:** Static assets polling controller works correctly, updates assets, and doesn't cause performance issues.

---

## Perps / Trade

### PERPS-01 – Perps transaction history UI

| Field | Value |
|-------|--------|
| **ID** | PERPS-01 |
| **Priority** | High |
| **PR** | #39445 |
| **Why Test** | New feature: users need to see their perps trading history. This is essential for tracking positions, PnL, and trade execution. |

**Preconditions**

- Perps enabled via remote feature flag `perpsEnabledVersion` (or equivalent). Wallet with or without prior perps activity.

**Steps**

1. Open Perps (tab or entry from Home). Navigate to **Activity** / **Transaction history** (route or tab that shows perps history).
2. If no history: **Expected** – Empty state with clear message (e.g. "No transactions").
3. If history exists (or after placing/closing a position in test): **Expected** – List of perps transactions with at least: type (e.g. open/close), market, size, date/time, PnL if applicable. No duplicate or missing rows.
4. Sort/filter if available; **Expected** – List updates correctly.
5. Open a transaction row if supported; **Expected** – Details are consistent with list row.
6. Verify pagination if there are many transactions. **Expected** – Loads more transactions correctly.

**Pass criteria:** Perps transaction history screen loads and shows correct, complete list of perps transactions (or correct empty state).

---

### PERPS-02 – Perps order entry (behind feature flag)

| Field | Value |
|-------|--------|
| **ID** | PERPS-02 |
| **Priority** | High |
| **PR** | #39659 |
| **Why Test** | New feature: static order entry UI is a core trading feature. Must work correctly for users to place orders. Critical for perps functionality. |

**Preconditions**

- Perps enabled. Order entry feature flag enabled (static order entry).

**Steps**

1. Navigate to Perps → Market list → open a **market detail** page.
2. **Expected:** Order entry UI is visible (e.g. Long/Short, amount, leverage, order type).
3. Enter values (e.g. amount, leverage). **Expected:** Fields accept input; validation errors shown when invalid (e.g. insufficient balance).
4. If "Place order" / "Preview" is available (and test env allows): submit or preview. **Expected:** No crash; either order submission or clear error message.
5. Switch between Long and Short; **Expected:** UI updates (e.g. "Close" side); no stale values from previous side.
6. Change market (back to list, open another market). **Expected:** Order entry resets or shows correct default for new market.
7. Test with different order types if available (market, limit, etc.). **Expected:** Each type works correctly.

**Pass criteria:** Order entry renders, accepts input, validates, and does not crash; Long/Short and market switch behave correctly.

---

### PERPS-03 – Perps tab and home navigation (feature flag off/on)

| Field | Value |
|-------|--------|
| **ID** | PERPS-03 |
| **Priority** | High |
| **Why Test** | Feature flag behavior must work correctly. When disabled, perps should be hidden. When enabled, all navigation should work. |

**Preconditions**

- Ability to toggle perps feature flag (or test with flag on and off in two builds).

**Steps**

1. With Perps **disabled:** **Expected** – No Perps tab in account overview; no Perps entry on Home (or entry is hidden). Direct URL to `/perps/home` redirects to default route (e.g. Home).
2. With Perps **enabled:** **Expected** – Perps tab visible in account overview. Tapping it shows Perps content (e.g. positions/orders or empty state). "Manage balance" / "Start trade" navigates to Perps home; back returns to tab.
3. From Perps home, open Market list, then a market detail. **Expected:** Navigation works; back from detail goes to list; back from list goes to home.
4. Open Perps **activity** from home or tab. **Expected:** Activity/history screen loads; back returns to previous screen.
5. Test deep linking to perps routes. **Expected:** Deep links work correctly when feature is enabled.

**Pass criteria:** Perps is hidden when flag is off; when on, tab and all perps routes navigate correctly.

---

### PERPS-04 – Perps UI in popup and narrow viewport

| Field | Value |
|-------|--------|
| **ID** | PERPS-04 |
| **Priority** | Medium |
| **Why Test** | Perps UI must be usable in all viewport sizes. Trading features need to work in popup mode for users who prefer that interface. |

**Preconditions**

- Perps enabled. Extension as popup and as narrow window (~400px).

**Steps**

1. Open extension as **popup**. Go to Perps tab or Perps home. **Expected:** Content fits; no horizontal scroll; buttons and list items are tappable.
2. Open Market list in popup. **Expected:** List readable; rows clickable; search/filter usable if present.
3. Open a market detail in popup. **Expected:** Chart/placeholder, order entry (if enabled), and action buttons visible and usable.
4. Repeat in **narrow full window** (e.g. 400px width). **Expected:** Same; no layout break or overflow.
5. Test order entry form in popup. **Expected:** All fields visible and usable; form doesn't overflow.
6. Test transaction history in popup. **Expected:** List is scrollable and readable.

**Pass criteria:** Perps tab, list, and detail are usable in popup and narrow viewport without layout or interaction issues.

---

### PERPS-05 – Perps positions and balance management

| Field | Value |
|-------|--------|
| **ID** | PERPS-05 |
| **Priority** | High |
| **Why Test** | Core trading functionality: users need to manage their perps balance and view open positions. This is essential for the trading experience. |

**Preconditions**

- Perps enabled. Wallet with perps balance or ability to add balance.

**Steps**

1. Navigate to Perps home.
2. **Expected:** Current balance is displayed correctly.
3. If balance is zero: test "Add balance" / "Deposit" flow. **Expected:** Flow works correctly; balance updates after deposit.
4. If positions exist: **Expected:** Open positions are displayed with correct data (market, size, entry price, PnL, etc.).
5. Open a position detail if available. **Expected:** Full position details are shown.
6. Test closing a position (if test environment allows). **Expected:** Close flow works; position updates or disappears from list.
7. Verify balance updates correctly after position changes. **Expected:** Balance reflects current state.

**Pass criteria:** Perps balance and positions are displayed and managed correctly.

---

## Hardware Wallets

### HW-01 – Ledger connectivity with WebHID transport

| Field | Value |
|-------|--------|
| **ID** | HW-01 |
| **Priority** | High |
| **PR** | #39537 |
| **Why Test** | Critical fix: replaced iframe bridge with direct WebHID transport. This fixes connectivity issues. Must verify Ledger works correctly with new transport method. |

**Preconditions**

- Ledger device available and connected via USB.
- Chrome browser (WebHID support).
- Wallet unlocked.

**Steps**

1. Open account menu → Connect Hardware Wallet.
2. Select Ledger.
3. **Expected:** Connection flow uses WebHID (no iframe); device is detected.
4. Follow connection prompts. **Expected:** Device connects successfully.
5. Select accounts to import. **Expected:** Accounts are derived correctly.
6. Complete import. **Expected:** Accounts appear in account list.
7. Test signing a transaction with Ledger account. **Expected:** Transaction prompts appear on device; signing works.
8. Disconnect and reconnect Ledger. **Expected:** Reconnection works correctly.
9. Test in Firefox (if applicable). **Expected:** Appropriate message if WebHID not supported.

**Pass criteria:** Ledger connects and works correctly with WebHID transport; no iframe bridge issues.

---

### HW-02 – Keystone camera permissions in sidebar mode

| Field | Value |
|-------|--------|
| **ID** | HW-02 |
| **Priority** | Medium |
| **PR** | #39438 |
| **Why Test** | Bug fix: camera permissions were failing in sidebar mode. This affects QR code scanning for Keystone hardware wallet. |

**Preconditions**

- Keystone hardware wallet available.
- Extension in sidebar mode.
- Camera permissions available.

**Steps**

1. Open extension in sidebar mode.
2. Navigate to Connect Hardware Wallet → Keystone.
3. **Expected:** Camera permission prompt appears (if not already granted).
4. Grant camera permission. **Expected:** Camera activates and QR scanner appears.
5. Scan QR code from Keystone device. **Expected:** QR code is read correctly.
6. Complete connection flow. **Expected:** Keystone account is imported successfully.
7. Test in popup mode as well. **Expected:** Camera permissions work in both modes.

**Pass criteria:** Camera permissions work correctly in sidebar mode for Keystone QR scanning.

---

### HW-03 – Keycard Shell QR-based hardware wallet

| Field | Value |
|-------|--------|
| **ID** | HW-03 |
| **Priority** | Medium |
| **PR** | #36911 |
| **Why Test** | New hardware wallet support: Keycard Shell added to QR-based hardware wallets list. Verify it appears and works correctly. |

**Preconditions**

- Keycard Shell device available (if possible for testing).
- Extension unlocked.

**Steps**

1. Navigate to Connect Hardware Wallet.
2. **Expected:** Keycard Shell appears in the list of QR-based hardware wallets (alongside Keystone, etc.).
3. Select Keycard Shell.
4. **Expected:** Connection flow starts; QR scanner appears if needed.
5. Follow connection prompts. **Expected:** Connection flow works correctly.
6. If device available: complete connection. **Expected:** Account is imported successfully.
7. Verify Keycard Shell accounts work for signing. **Expected:** Signing flow works.

**Pass criteria:** Keycard Shell appears in hardware wallet list and connection flow works correctly.

---

## Dapp Connections

### CONN-01 – Disconnect all button in dapp connections main screen

| Field | Value |
|-------|--------|
| **ID** | CONN-01 |
| **Priority** | High |
| **PR** | #39791 |
| **Why Test** | New feature: "Disconnect all" button improves UX by allowing users to disconnect all dapps at once instead of one by one. This is a common user request. |

**Preconditions**

- Wallet with multiple connected dapps.
- Navigate to Settings → Connected Sites (or Permissions page).

**Steps**

1. Navigate to the main dapp connections screen (list of all connected sites).
2. **Expected:** "Disconnect all" button is visible (likely at top of list or in header).
3. Click "Disconnect all". **Expected:** Confirmation modal appears (to prevent accidental disconnection).
4. Confirm disconnection. **Expected:** All connected sites are disconnected.
5. Switch to a connected dapp. **Expected:** Dapp shows as disconnected (no account access).
6. Verify individual disconnect still works. **Expected:** Can disconnect individual sites.
7. Test with zero connections. **Expected:** "Disconnect all" button is hidden or disabled.

**Pass criteria:** "Disconnect all" button appears, works correctly, and disconnects all sites with confirmation.

---

### CONN-02 – Fullscreen rendering of Dapp Connections pages

| Field | Value |
|-------|--------|
| **ID** | CONN-02 |
| **Priority** | Medium |
| **PR** | #39801 |
| **Why Test** | Bug fix: layout changed from LegacyLayout to DefaultLayout. Verify pages render correctly in fullscreen and don't have layout issues. |

**Preconditions**

- Wallet with connected dapps.
- Extension in full window mode.

**Steps**

1. Navigate to Settings → Connected Sites (or Permissions).
2. **Expected:** Page renders correctly in full window; no layout issues.
3. Open a specific site's permission page. **Expected:** Page renders correctly with DefaultLayout.
4. Test navigation between connection pages. **Expected:** All pages use consistent layout.
5. Test in popup mode. **Expected:** Layout adapts correctly.
6. Verify all UI elements are visible and accessible. **Expected:** No content cut off or overlapping.

**Pass criteria:** Dapp Connections pages render correctly in fullscreen with DefaultLayout; no layout issues.

---

## Shield

### SHIELD-01 – Shield notification in app navigation

| Field | Value |
|-------|--------|
| **ID** | SHIELD-01 |
| **Priority** | Medium |
| **PR** | #39788 |
| **Why Test** | New feature: shield notifications in navigation improve visibility of important shield-related updates or alerts. |

**Preconditions**

- Shield feature enabled.
- Wallet with shield subscription or eligible for shield.

**Steps**

1. Navigate to Home or main navigation.
2. **Expected:** Shield notification indicator appears if there are shield-related notifications (e.g. payment due, subscription update).
3. Click on shield notification. **Expected:** Navigates to relevant shield page or shows notification details.
4. Dismiss notification if possible. **Expected:** Notification disappears.
5. Trigger a shield notification event (e.g. payment due, subscription change). **Expected:** Notification appears in navigation.
6. Verify notification doesn't interfere with other navigation elements. **Expected:** Layout remains correct.

**Pass criteria:** Shield notifications appear in app navigation and work correctly.

---

### SHIELD-02 – Reset shield default payment method after payment flow cancel

| Field | Value |
|-------|--------|
| **ID** | SHIELD-02 |
| **Priority** | Medium |
| **PR** | #39695 |
| **Why Test** | Bug fix: payment method should reset to most suitable one (crypto) after canceling payment flow. This ensures users have the best payment option selected. |

**Preconditions**

- Shield subscription active.
- Multiple payment methods available (crypto and card).

**Steps**

1. Navigate to Shield payment settings.
2. Note current default payment method.
3. Start payment flow (e.g. update payment method).
4. Cancel the payment flow (close modal, click cancel, etc.).
5. **Expected:** Default payment method resets to most suitable one (crypto if available).
6. Verify payment method is actually set correctly. **Expected:** Next payment attempt uses the reset method.
7. Test with only one payment method available. **Expected:** That method remains selected.

**Pass criteria:** Shield default payment method resets to most suitable option (crypto) after canceling payment flow.

---

### SHIELD-03 – Handle subscription reload when closing shield payment update stripe tab

| Field | Value |
|-------|--------|
| **ID** | SHIELD-03 |
| **Priority** | Medium |
| **PR** | #39814 |
| **Why Test** | Bug fix: subscription state should reload correctly when user closes the Stripe payment tab. This prevents stale state and ensures subscription status is accurate. |

**Preconditions**

- Shield subscription active.
- Ability to trigger payment update flow that opens Stripe.

**Steps**

1. Navigate to Shield payment settings.
2. Initiate payment method update that opens Stripe checkout in new tab.
3. Close the Stripe tab without completing payment.
4. Return to MetaMask extension.
5. **Expected:** Subscription state reloads; current payment method and subscription status are correct.
6. Verify subscription still works correctly. **Expected:** No errors or stale state.
7. Test completing payment in Stripe. **Expected:** Subscription updates correctly after completion.

**Pass criteria:** Subscription reloads correctly when Stripe payment tab is closed; no stale state.

---

## NFTs

### NFT-01 – Deeplinking to NFT tab

| Field | Value |
|-------|--------|
| **ID** | NFT-01 |
| **Priority** | Medium |
| **PR** | #39669 |
| **Why Test** | New feature: deeplinking allows users to navigate directly to NFT tab from external links or notifications. Improves user experience and navigation. |

**Preconditions**

- Wallet with NFTs.
- Extension unlocked.

**Steps**

1. Use a deeplink URL that targets NFT tab (e.g. `metamask://nft` or similar format used by MetaMask).
2. **Expected:** Extension opens and navigates directly to NFT tab.
3. Verify NFT tab loads correctly. **Expected:** NFTs are displayed.
4. Test deeplink from browser address bar (if supported). **Expected:** Works correctly.
5. Test deeplink from external app/notification. **Expected:** Works correctly.
6. Test with extension locked. **Expected:** Unlocks first, then navigates to NFT tab.
7. Test with no NFTs. **Expected:** NFT tab opens with empty state.

**Pass criteria:** Deeplinking to NFT tab works correctly from various sources.

---

## Network & Gas

### NET-01 – Tempo testnet native and network token IDs and images

| Field | Value |
|-------|--------|
| **ID** | NET-01 |
| **Priority** | Low |
| **PR** | #39491 |
| **Why Test** | New network support: Tempo testnet added. Verify network appears correctly with proper token IDs and images. |

**Preconditions**

- Extension unlocked.
- Tempo testnet available in network list or can be added.

**Steps**

1. Navigate to network selector or add network.
2. **Expected:** Tempo testnet appears in list (if popular) or can be added.
3. Add/switch to Tempo testnet.
4. **Expected:** Network switches successfully.
5. Verify native token displays correctly. **Expected:** Token symbol, name, and image are correct.
6. Check network token (if different from native). **Expected:** Token IDs and images are correct.
7. Test sending transaction on Tempo. **Expected:** Works correctly.
8. Verify network explorer link works. **Expected:** Links to correct explorer.

**Pass criteria:** Tempo testnet is available and displays with correct token IDs and images.

---

### GAS-01 – Warning message when gas sponsorship unavailable due to reserve balance

| Field | Value |
|-------|--------|
| **ID** | GAS-01 |
| **Priority** | Medium |
| **PR** | #39284 |
| **Why Test** | New feature: users need clear warning when gas sponsorship is unavailable. This prevents confusion when transactions can't be sponsored. |

**Preconditions**

- Wallet on a network that supports gas sponsorship.
- Account with low balance (below reserve requirement) or scenario where sponsorship is unavailable.

**Steps**

1. Initiate a transaction that would normally use gas sponsorship.
2. **Expected:** Warning message appears indicating gas sponsorship is unavailable due to reserve balance requirements.
3. Verify message is clear and actionable. **Expected:** User understands why sponsorship is unavailable.
4. Check if user can still proceed with transaction (paying gas themselves). **Expected:** Option to proceed is available.
5. Test with sufficient balance for sponsorship. **Expected:** No warning; sponsorship works normally.
6. Test on different networks. **Expected:** Warning appears only when conditions are met.

**Pass criteria:** Warning message appears correctly when gas sponsorship is unavailable due to reserve balance requirements.

---

### GAS-02 – Cancel and speedup modal UI improvements

| Field | Value |
|-------|--------|
| **ID** | GAS-02 |
| **Priority** | Medium |
| **PR** | #39661 |
| **Why Test** | UI fix: removed emojis, standardized button width, migrated to current component versions. Ensures consistent, professional UI. |

**Preconditions**

- Wallet with pending transaction.

**Steps**

1. Open Activity tab.
2. Find a pending transaction.
3. Click to open transaction details or use cancel/speedup option.
4. **Expected:** Cancel and speedup modal appears.
5. Verify no emojis are present. **Expected:** Clean, professional UI.
6. Check button widths. **Expected:** Buttons have standardized width (consistent sizing).
7. Verify modal uses current component versions. **Expected:** Modal matches current design system.
8. Test cancel flow. **Expected:** Works correctly with new UI.
9. Test speedup flow. **Expected:** Works correctly with new UI.
10. Test in popup and full window. **Expected:** Modal renders correctly in both.

**Pass criteria:** Cancel and speedup modal uses updated UI without emojis, with standardized buttons, and current components.

---

### GAS-03 – Edit gas fee popover UI improvements

| Field | Value |
|-------|--------|
| **ID** | GAS-03 |
| **Priority** | Medium |
| **PR** | #39690 |
| **Why Test** | UI fix: removed black backgrounds and migrated to Modal component. Improves visual consistency and accessibility. |

**Preconditions**

- Wallet with pending transaction or ability to edit gas on new transaction.

**Steps**

1. Initiate a transaction or open pending transaction.
2. Click to edit gas fee.
3. **Expected:** Gas fee editor opens (now as Modal, not popover).
4. Verify no black backgrounds. **Expected:** UI uses proper colors from design system.
5. Check modal appearance. **Expected:** Matches current Modal component design.
6. Test gas fee editing. **Expected:** Can change gas price, limit, etc.
7. Save changes. **Expected:** Gas fee updates correctly.
8. Test in popup and full window. **Expected:** Modal works correctly in both.

**Pass criteria:** Edit gas fee uses Modal component without black backgrounds; UI is consistent and functional.

---

### GAS-04 – EIP-7702 delegation publish transactions fix

| Field | Value |
|-------|--------|
| **ID** | GAS-04 |
| **Priority** | High |
| **PR** | #39516 |
| **Why Test** | Critical bug fix: EIP-7702 delegation transactions were being dropped. This fix removes nonce from txParams to prevent the issue. Must verify EIP-7702 transactions work correctly. |

**Preconditions**

- Wallet on network that supports EIP-7702.
- Dapp or scenario that triggers EIP-7702 delegation.

**Steps**

1. Initiate an EIP-7702 delegation transaction from a dapp.
2. **Expected:** Transaction appears in MetaMask (not dropped).
3. Review transaction details. **Expected:** Transaction params are correct; nonce is handled properly.
4. Approve transaction. **Expected:** Transaction is submitted successfully.
5. Verify transaction appears on blockchain. **Expected:** Transaction is mined/confirmed.
6. Test multiple EIP-7702 transactions. **Expected:** All are handled correctly.
7. Compare with previous version (if possible). **Expected:** Transactions no longer dropped.

**Pass criteria:** EIP-7702 delegation publish transactions are not dropped and work correctly.

---

## Snaps

### SNAP-01 – Snap account creation uses account group names

| Field | Value |
|-------|--------|
| **ID** | SNAP-01 |
| **Priority** | Medium |
| **PR** | #39488 |
| **Why Test** | Bug fix: snap accounts should use account group names instead of old account names. This ensures consistent naming and better organization. |

**Preconditions**

- Snap that creates accounts installed.
- Ability to create new snap account.

**Steps**

1. Navigate to account creation flow for snap account.
2. Create a new snap account.
3. **Expected:** Account is created with account group name (not old account name format).
4. Verify account appears in account list. **Expected:** Account name follows new naming convention.
5. Check account details. **Expected:** Account group name is displayed correctly.
6. Create multiple snap accounts. **Expected:** All use account group names.
7. Compare with regular accounts. **Expected:** Naming is consistent where appropriate.

**Pass criteria:** Snap account creation uses account group names instead of old account names.

---

## Performance & UI

### PERF-01 – Critical performance fix: stabilizing props references in routes

| Field | Value |
|-------|--------|
| **ID** | PERF-01 |
| **Priority** | High |
| **PR** | #39311 |
| **Why Test** | Critical performance fix: props references were causing re-renders. This fix stabilizes references to prevent unnecessary re-renders and improve responsiveness. |

**Preconditions**

- Wallet with some state (tokens, transactions, etc.).

**Steps**

1. Open extension.
2. Navigate between different pages (Home, Activity, Settings, etc.).
3. **Expected:** Navigation is smooth and fast; no lag or delay.
4. Use browser DevTools Performance tab (if possible). **Expected:** Fewer re-renders than before fix.
5. Test rapid navigation (clicking between pages quickly). **Expected:** No performance degradation.
6. Test with many tokens/transactions. **Expected:** Performance remains good.
7. Test in popup and full window. **Expected:** Performance is good in both.
8. Monitor memory usage (if possible). **Expected:** No memory leaks from re-renders.

**Pass criteria:** Navigation and user actions are fast and responsive; no performance issues from props references.

---

### PERF-02 – MetaMetrics context cascade re-renders fix

| Field | Value |
|-------|--------|
| **ID** | PERF-02 |
| **Priority** | High |
| **PR** | #39310 |
| **Why Test** | Critical performance fix: MetaMetrics context was causing cascade re-renders of 149 subscribers on every navigation. This severely impacted performance. Must verify fix works. |

**Preconditions**

- Wallet unlocked.
- MetaMetrics enabled (if applicable).

**Steps**

1. Open extension.
2. Navigate between pages multiple times.
3. **Expected:** Navigation is fast; no noticeable lag.
4. Use React DevTools Profiler (if available in test environment). **Expected:** MetaMetrics context doesn't trigger cascade re-renders.
5. Test with many components/subscribers. **Expected:** Re-renders are minimal and targeted.
6. Verify MetaMetrics still tracks events correctly. **Expected:** Analytics still work despite performance fix.
7. Test rapid navigation. **Expected:** Performance remains good.
8. Compare performance with previous version (if possible). **Expected:** Significant improvement.

**Pass criteria:** MetaMetrics context no longer causes cascade re-renders; navigation is fast and analytics still work.

---

### UI-01 – Prevent scroll reset on interface update

| Field | Value |
|-------|--------|
| **ID** | UI-01 |
| **Priority** | Medium |
| **PR** | #39100 (from 13.17.0, but important to verify) |
| **Why Test** | UX improvement: scroll position should be maintained when interface updates. Prevents user frustration from losing scroll position. |

**Preconditions**

- Wallet with many tokens or transactions.

**Steps**

1. Navigate to a page with scrollable content (e.g. token list, activity list).
2. Scroll down (e.g. to middle or bottom of list).
3. Trigger an interface update (e.g. balance update, new transaction, token list refresh).
4. **Expected:** Scroll position is maintained; page doesn't jump to top.
5. Test with multiple updates in quick succession. **Expected:** Scroll position remains stable.
6. Test on different pages (token list, activity, etc.). **Expected:** Works on all scrollable pages.
7. Test in popup and full window. **Expected:** Works in both.

**Pass criteria:** Scroll position is maintained when interface updates; no unexpected scroll resets.

---

## Security & Privacy

### SEC-01 – SRP validation during import

| Field | Value |
|-------|--------|
| **ID** | SEC-01 |
| **Priority** | High |
| **PR** | #39679 |
| **Why Test** | Security improvement: SRP (Secret Recovery Phrase) validation during import prevents invalid or corrupted seed phrases from being imported. This is critical for security. |

**Preconditions**

- Extension on import/restore wallet screen.

**Steps**

1. Navigate to import wallet flow.
2. Enter an **invalid** SRP (wrong word, typo, wrong length, etc.).
3. **Expected:** Validation error appears immediately or on submit; import is blocked.
4. Enter a **valid** SRP.
5. **Expected:** Validation passes; import proceeds.
6. Test with SRP that has checksum error. **Expected:** Validation catches checksum error.
7. Test with SRP that has wrong word (not in BIP39 wordlist). **Expected:** Validation catches invalid word.
8. Test with correct SRP. **Expected:** Import succeeds.
9. Verify validation happens in real-time or on appropriate trigger. **Expected:** User gets feedback quickly.

**Pass criteria:** SRP validation works correctly during import; invalid SRPs are rejected, valid ones are accepted.

---

### SEC-02 – Sanitized origin to sentinel metadata

| Field | Value |
|-------|--------|
| **ID** | SEC-02 |
| **Priority** | Medium |
| **PR** | #39765 |
| **Why Test** | Security improvement: sanitizing origin in sentinel metadata prevents potential security issues from malicious origins. This is a defensive security measure. |

**Preconditions**

- Extension unlocked.
- Ability to trigger sentinel metadata collection (may require specific dapp interactions or scenarios).

**Steps**

1. Interact with a dapp that triggers sentinel metadata collection.
2. Check sentinel metadata (may require developer tools or logs). **Expected:** Origin is sanitized (e.g. protocol, domain normalized, no sensitive path/query params).
3. Test with various origin formats. **Expected:** All are sanitized correctly.
4. Test with potentially malicious origins (if safe to test). **Expected:** Malicious content is removed/sanitized.
5. Verify functionality still works. **Expected:** Sentinel features work despite sanitization.
6. Test in different scenarios (different dapps, different request types). **Expected:** Sanitization is consistent.

**Pass criteria:** Origin is sanitized in sentinel metadata; no security issues from unsanitized origins.

---

### SEC-03 – RPC method metamask_sendDomainMetadata no longer has effect

| Field | Value |
|-------|--------|
| **ID** | SEC-03 |
| **Priority** | Low |
| **PR** | #39642 |
| **Why Test** | Security/cleanup: deprecated RPC method should no longer work. This prevents potential security issues from legacy method usage. |

**Preconditions**

- Extension unlocked.
- Ability to call RPC methods (via console or dapp).

**Steps**

1. Call `metamask_sendDomainMetadata` RPC method (via console: `window.ethereum.request({ method: 'metamask_sendDomainMetadata', params: [...] })`).
2. **Expected:** Method returns error or no-op; no effect on extension state.
3. Verify no domain metadata is stored/changed. **Expected:** Extension state unchanged.
4. Test with various parameters. **Expected:** All calls have no effect.
5. Verify other RPC methods still work. **Expected:** Only this deprecated method is disabled.

**Pass criteria:** `metamask_sendDomainMetadata` RPC method has no effect; deprecated method is properly disabled.

---

## Cross-Cutting Tests

### CROSS-01 – Token details: swap and send/receive activity together

| Field | Value |
|-------|--------|
| **ID** | CROSS-01 |
| **Priority** | Medium |
| **Why Test** | Ensures all activity types appear together in token details. This is a cross-cutting concern between swaps and assets features. |

**Preconditions**

- One token with both swap and send/receive history.

**Steps**

1. Open that token's detail page. Open Activity section.
2. **Expected:** Both swap(s) and send/receive transactions appear in one list; order makes sense (e.g. by date); each row shows correct type and amount.
3. Click a swap row if detail exists; **Expected:** Correct from/to and amounts. Return to token detail; **Expected:** List still correct.
4. Verify filtering/sorting if available. **Expected:** Works correctly across all activity types.

**Pass criteria:** Token details show a single, correct activity list that includes swaps and send/receive.

---

### CROSS-02 – Performance across all features

| Field | Value |
|-------|--------|
| **ID** | CROSS-02 |
| **Priority** | High |
| **Why Test** | Performance fixes affect all features. Verify that performance improvements don't break functionality and that all features remain fast. |

**Preconditions**

- Wallet with various state (tokens, transactions, connected dapps, etc.).

**Steps**

1. Test navigation between all major features (Home, Activity, Swap, Perps, Settings, etc.).
2. **Expected:** All navigation is fast and smooth.
3. Test feature interactions (e.g. swap, send, connect dapp, etc.). **Expected:** All work correctly and quickly.
4. Test with extension in popup, sidepanel, and full window. **Expected:** Performance is good in all modes.
5. Test rapid user actions (clicking quickly between features). **Expected:** No lag or freezing.
6. Monitor for any regressions. **Expected:** No features are slower than before.

**Pass criteria:** All features work correctly and maintain good performance after performance fixes.

---

## Test Execution Summary

| Area | Test IDs | Count | Priority Breakdown |
|------|----------|-------|-------------------|
| **Swaps** | SWAP-01 to SWAP-06 | 6 | High: 3, Medium: 3 |
| **Assets UX** | ASSET-01 to ASSET-06 | 6 | High: 2, Medium: 3, Low: 1 |
| **Perps / Trade** | PERPS-01 to PERPS-05 | 5 | High: 4, Medium: 1 |
| **Hardware Wallets** | HW-01 to HW-03 | 3 | High: 1, Medium: 2 |
| **Dapp Connections** | CONN-01 to CONN-02 | 2 | High: 1, Medium: 1 |
| **Shield** | SHIELD-01 to SHIELD-03 | 3 | Medium: 3 |
| **NFTs** | NFT-01 | 1 | Medium: 1 |
| **Network & Gas** | NET-01, GAS-01 to GAS-04 | 5 | High: 1, Medium: 4 |
| **Snaps** | SNAP-01 | 1 | Medium: 1 |
| **Performance & UI** | PERF-01, PERF-02, UI-01 | 3 | High: 2, Medium: 1 |
| **Security & Privacy** | SEC-01 to SEC-03 | 3 | High: 1, Medium: 1, Low: 1 |
| **Cross-Cutting** | CROSS-01 to CROSS-02 | 2 | High: 1, Medium: 1 |
| **Total** | | **40** | **High: 15, Medium: 22, Low: 3** |

---

## Suggested Test Execution Order

### Phase 1: Critical Path (High Priority)
1. SWAP-01 (Restore quote in popup)
2. SWAP-02 (MM fee disclaimer)
3. SWAP-03 (Swap activity in token details)
4. ASSET-01 (Clickable area fix)
5. ASSET-02 (Token activity complete)
6. PERPS-01 (Transaction history)
7. PERPS-02 (Order entry)
8. HW-01 (Ledger WebHID)
9. GAS-04 (EIP-7702 fix)
10. PERF-01 (Props references performance)
11. PERF-02 (MetaMetrics re-renders)
12. SEC-01 (SRP validation)
13. CROSS-02 (Performance across features)

### Phase 2: Feature Completeness (Medium/High Priority)
14. SWAP-04 to SWAP-06
15. ASSET-03 to ASSET-06
16. PERPS-03 to PERPS-05
17. HW-02 to HW-03
18. CONN-01 to CONN-02
19. SHIELD-01 to SHIELD-03
20. NFT-01
21. NET-01, GAS-01 to GAS-03
22. SNAP-01
23. UI-01
24. SEC-02 to SEC-03
25. CROSS-01

### Phase 3: Polish & Edge Cases (All Remaining)
26. All remaining tests
27. Edge case scenarios
28. Browser compatibility (Firefox MV2)
29. Viewport variations (popup, sidepanel, full window)

---

## Test Environments

- **Primary:** Chrome MV3 (popup + full window)
- **Secondary:** Firefox MV2 (popup + full window)
- **Viewports:** Popup (~400px), Sidepanel (~400px), Full window (various sizes)
- **Networks:** Mainnet, Testnets (including Tempo), Custom networks

---

## Notes

- **Feature Flags:** Some features (Perps order entry) require feature flags. Ensure flags are enabled for testing.
- **Hardware Wallets:** Ledger and Keystone tests require physical devices. Keycard Shell test may require device or can verify UI only.
- **Performance Testing:** Use browser DevTools Performance and React DevTools Profiler when available to verify performance improvements.
- **Regression Focus:** Pay special attention to performance fixes (PERF-01, PERF-02) as they affect all features. Verify no regressions.
- **Trade/Perps Section:** All perps tests are grouped in the "Perps / Trade" section as requested. These are critical for the trading feature release.

---

## Differences from Previous Test Plan

### Added Tests (Not in Original Plan)
- SWAP-06: Bridge getToken caching
- ASSET-05: Activity Log header arrow disclosure
- ASSET-06: Static assets polling controller
- PERPS-05: Positions and balance management
- HW-01: Ledger WebHID transport (critical fix)
- HW-02: Keystone camera permissions
- HW-03: Keycard Shell support
- CONN-01: Disconnect all button
- CONN-02: Fullscreen rendering fix
- SHIELD-01 to SHIELD-03: All shield-related tests
- NFT-01: Deeplinking to NFT tab
- NET-01: Tempo testnet
- GAS-01 to GAS-04: All gas-related tests
- SNAP-01: Snap account naming
- PERF-01, PERF-02: Performance fixes
- UI-01: Scroll reset prevention
- SEC-01 to SEC-03: Security improvements
- CROSS-02: Performance across features

### Enhanced Organization
- Added dedicated "Perps / Trade" section as requested
- Grouped all related tests by feature area
- Added "Why Test" explanations for all tests
- Expanded test coverage from 14 to 40 tests
- Added priority breakdown and execution phases

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-06  
**Author:** AI Agent (based on changelog analysis)
