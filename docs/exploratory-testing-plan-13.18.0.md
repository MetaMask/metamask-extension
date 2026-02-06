# Exploratory Test Plan - Release 13.18.0 (branch release/13.18.0)

## Inputs reviewed
- Release branch: origin/release/13.18.0
- Comparison baseline: origin/release/13.17.0
- Sources: CHANGELOG 13.18.0 and git log filtered by area keywords

## PR inventory by focus area

### Swaps / Bridge
- [#39653](https://github.com/MetaMask/metamask-extension/pull/39653) - chore: update swap MM fee disclaimer
- [#39654](https://github.com/MetaMask/metamask-extension/pull/39654) - fix: restore swap/bridge quote if using extension in popup mode
- [#39541](https://github.com/MetaMask/metamask-extension/pull/39541) - feat: cache bridge getToken responses
- [#39747](https://github.com/MetaMask/metamask-extension/pull/39747) - fix: wait for input value and fetch calls during unit test execution (swaps)

### Perps
- [#39445](https://github.com/MetaMask/metamask-extension/pull/39445) - feat: implement tx history for perps
- [#39659](https://github.com/MetaMask/metamask-extension/pull/39659) - feat: Perps Order entry (static)

### Predictions
- No PRs in 13.18.0 explicitly mention Predictions. Existing deep link route `/predict`
  is still present and should be regression tested.

### Mobile Core UX
- [#39801](https://github.com/MetaMask/metamask-extension/pull/39801) - fix: render "Dapp Connections" pages with constrained max width
- [#39661](https://github.com/MetaMask/metamask-extension/pull/39661) - fix: update cancel/speedup modal UI and migrate to non-deprecated components
- [#39690](https://github.com/MetaMask/metamask-extension/pull/39690) - fix: remove black backgrounds on fees and migrate edit-gas-fee-popover to Modal
- [#39767](https://github.com/MetaMask/metamask-extension/pull/39767) - fix: update activity log header to use arrow disclosure variant
- [#39679](https://github.com/MetaMask/metamask-extension/pull/39679) - fix: add SRP validation during import
- [#39438](https://github.com/MetaMask/metamask-extension/pull/39438) - fix: enhance webcam utility to support sidepanel environment
- [#39311](https://github.com/MetaMask/metamask-extension/pull/39311) - fix: stabilize withRouterHooks props by memoizing params/location references
- [#39310](https://github.com/MetaMask/metamask-extension/pull/39310) - perf: memoize MetaMetrics context to prevent cascade re-renders

### Assets
- [#39448](https://github.com/MetaMask/metamask-extension/pull/39448) - feat: Static Assets Polling
- [#39646](https://github.com/MetaMask/metamask-extension/pull/39646) - chore: upgrade assets-controllers to v99
- [#39669](https://github.com/MetaMask/metamask-extension/pull/39669) - feat: added deeplinking to the NFT tab
- [#39823](https://github.com/MetaMask/metamask-extension/pull/39823) - fix: increase clickable outside area from asset list control buttons
- [#39498](https://github.com/MetaMask/metamask-extension/pull/39498) - fix: container based nft grid
- [#39753](https://github.com/MetaMask/metamask-extension/pull/39753) - fix: missing swap activity in token details
- [#39777](https://github.com/MetaMask/metamask-extension/pull/39777) - chore: remove dead code - nft tab picker
- [#39491](https://github.com/MetaMask/metamask-extension/pull/39491) - feat(Networks): Add Tempo Testnet

## Test setup and data
- Build target: Chrome MV3 release branch build.
- Accounts: one account with ERC-20 balance, one account with NFT, and one clean account.
- Networks: Ethereum mainnet, Polygon, Tempo Testnet (new network), and a test RPC.
- Perps feature flag (remote): enable via manifest overrides:
  - `.manifest-overrides.json`:
    - `_flags.remoteFeatureFlags.perpsEnabledVersion = { "enabled": true, "minimumVersion": "0.0.0" }`
- Deep link tests: use signed and unsigned links with `link.metamask.io`.

## Exploratory charters

### Swaps / Bridge
1. Quote persistence in popup mode
   - Open swap/bridge in popup, fill From/To, capture quote, close popup, reopen.
   - Validate quote restore behavior and no stale fee values.
2. MM fee disclaimer visibility
   - Compare swaps with and without MM feeData in quote response.
   - Confirm disclaimer toggles correctly and does not flicker on re-quote.
3. Bridge getToken caching behavior
   - Search assets across multiple networks and switch networks rapidly.
   - Confirm token metadata is current and not cross-network mixed.
4. Swap activity in token details
   - Perform swap and check token details activity list for accurate entries.
5. Failure modes
   - Unsupported token, quote timeout, and insufficient balance paths.

### Perps
1. Feature flag gating
   - Flag disabled: no Perps entry points visible.
   - Flag enabled: Perps entry points visible and load without errors.
2. Transaction history UI
   - Empty state, pagination/scroll, and ordering correctness.
3. Static order entry
   - Validate UI states, disabled CTA, and error messaging when inputs invalid.
4. Navigation and performance
   - Route transitions to/from Perps pages remain responsive.

### Predictions
1. Deep link `/predict`
   - Signed and unsigned `https://link.metamask.io/predict` links.
   - Verify redirect to `/prediction-markets` and preserve query params.
2. Locked and unlocked flows
   - Confirm interstitial behavior and post-unlock continuation.

### Mobile Core UX
1. Layout constraints in compact views
   - Dapp Connections pages in sidepanel, popup, and fullscreen.
2. Modal updates
   - Cancel/speedup modal and edit gas fee modal: layout, focus trap, escape/close.
3. Activity log header control
   - Arrow disclosure behavior, keyboard navigation, and hover states.
4. SRP import validation
   - Invalid formats, extra whitespace, mixed casing, and partial SRP entries.
5. Sidepanel camera flow
   - Trigger hardware wallet scan flow and confirm permissions prompt path.
6. Navigation performance sanity
   - Rapid nav between Home, Activity, and Settings without UI jank.

### Assets
1. Static assets polling
   - Balance updates after incoming tx and after switching accounts.
2. Asset list controls
   - Verify close and filter controls are clickable around edges.
3. NFT tab deep links
   - Deep link to NFT tab and ensure correct tab selection and scroll position.
4. NFT grid responsiveness
   - Resize popup/sidepanel and verify grid column consistency.
5. Token details activity
   - Swap activity appears with accurate token amounts and timestamps.
6. Tempo Testnet assets
   - Add network, verify token icons and default asset list display.

## Exit criteria
- No P0/P1 defects in scoped areas.
- All new PR-related behaviors verified in at least one target view.
- Any regressions recorded with repro steps and screenshots.
