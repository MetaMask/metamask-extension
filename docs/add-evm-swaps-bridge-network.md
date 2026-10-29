# Add EVM Swaps/Bridge Network

## Use This Standard When

- A task asks to add a new EVM network to the unified swaps/bridge flow.
- The request mentions the bridge chain allowlist, `chainRanking`, default destination token, or stablecoin slippage for a new EVM chain.
- The rollout is controlled by `@metamask/bridge-controller` and the `bridgeConfigV2` remote feature flag.

This standard covers the **unified swaps/bridge flow only**. It does not cover legacy swaps (`shared/constants/swaps.ts`) or WETH wrapping logic.

## Prerequisites

Confirm all are true before implementation:

- The chain is already registered in `shared/constants/network.ts` (`CHAIN_IDS` entry, display name, image URL, and a `FEATURED_RPCS` entry with an RPC and block explorer). If missing, add it first.
- `@metamask/bridge-controller` supports the chain (see the upstream layer below). This is the critical prerequisite — without it, every client-side change is a no-op.
- The default destination token address and its decimals are known.
- The chain's stablecoin ERC-20 addresses (and decimals) are known, if 0.5% stablecoin slippage is expected.

If a prerequisite is missing, stop and report the blocker instead of partially wiring the feature.

## Two-Layer Chain Allowlist

The flow gates chains through two independent layers. Both must allow the chain or it never renders:

1. **Hard allowlist** — `ALLOWED_BRIDGE_CHAIN_IDS` from `@metamask/bridge-controller`. Any chain absent here is silently filtered out regardless of feature flags.
2. **Remote feature flag** — `bridgeConfigV2.chainRanking`. The client intersects this with the hard allowlist before rendering. A chain in the allowlist but absent from `chainRanking` will not surface in the picker.

## Reference Implementations

- MegaETH: `https://github.com/MetaMask/metamask-extension/pull/39927`
- Robinhood Chain: most recent EVM integration; follows the exact layers below. `https://github.com/MetaMask/metamask-extension/pull/44347`

Review the MegaETH and Robinhood PRs before coding to mirror existing patterns and naming.

## Agent Skill Entrypoints

Use these entrypoints:

- SSOT policy + execution standard: this document
- Cursor skill entrypoint: `.cursor/skills/mms-add-evm-swaps-bridge-network/SKILL.md`
- Other harnesses: start prompts with `Follow docs/add-evm-swaps-bridge-network.md section "Agent Execution Standard (SSOT)".`

## Agent Execution Standard (SSOT)

For agent implementation or review tasks, follow this workflow exactly:

1. Confirm the prerequisites are satisfied. If not, stop and report the blocker.
2. Review the MegaETH reference PR before making edits.
3. Ensure the chain exists in `@metamask/bridge-controller` (upstream layer). Bump the dependency if a new release is required.
4. Update the code-gated bridge constants in `shared/constants/bridge.ts`.
5. Add the chain's stablecoins to `ui/pages/bridge/utils/stablecoins.ts`.
6. Update the `bridgeConfigV2` remote feature flag (`chains` + `chainRanking` + top-level `stablecoins`).
7. Add or update unit tests for the changed areas.
8. Run targeted tests and dependency housekeeping, then note any remaining gaps.

### 1) Upstream: `@metamask/bridge-controller` (required prerequisite)

The chain must exist in the installed version of the package. Verify these are present in `@metamask/bridge-controller`:

- `ChainId` enum entry (decimal chain ID).
- `CHAIN_IDS` entry (hex chain ID).
- The chain ID in `ALLOWED_BRIDGE_CHAIN_IDS` (the hard allowlist).

If the installed version lacks the chain, coordinate an upstream release in the `core` monorepo (`packages/bridge-controller`) and bump the dependency in `package.json`. If it is already present, no upstream change is needed.

### 2) Code-gated constants: `shared/constants/bridge.ts`

Update all relevant entries, keeping naming and ordering consistent with existing networks:

- `ALLOWED_EVM_BRIDGE_CHAIN_IDS` — add `CHAIN_IDS.<NETWORK>`. This propagates automatically to `ALLOWED_BRIDGE_CHAIN_IDS`, `ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP`, and `ALL_ALLOWED_BRIDGE_CHAIN_IDS`.
- `NETWORK_TO_SHORT_NETWORK_NAME_MAP` — add both the hex and CAIP forms (`[CHAIN_IDS.<NETWORK>]` and `[toEvmCaipChainId(CHAIN_IDS.<NETWORK>)]`).
- `BRIDGE_CHAINID_COMMON_TOKEN_PAIR` — add a default destination token entry keyed by the CAIP chain ID. Use `toChecksumHexAddress(...)` for the `assetId` and include `address`, `symbol`, `decimals`, `name`, `assetId`.

### 3) Stablecoins: `ui/pages/bridge/utils/stablecoins.ts`

Add the chain's stablecoin ERC-20 addresses to `STABLECOIN_ASSET_IDS` via `toAssetId(address, CHAIN_IDS.<NETWORK>)`. This is what makes the slippage service apply the lower 0.5% default rate for stablecoin-to-stablecoin swaps. Addresses are normalized to lowercase, so casing does not matter here.

### 4) Remote feature flag: `bridgeConfigV2`

This is a backend/infra change (LaunchDarkly), not a repo file, but it is required for the chain to render:

- Add a `chains["<decimalChainId>"]` entry with at least `isActiveSrc: true`, `isActiveDest: true`, `isSingleSwapBridgeButtonEnabled: true`. Optionally add `topAssets` and `batchSellDestStablecoins`.
- Add an entry to the `chainRanking` array (`{ "chainId": "eip155:<decimal>", "name": "<Name>" }`). Array position controls ordering in the picker.
- Add the chain's stablecoins to the top-level `stablecoins` array for consistency with other consumers.
- Coordinate rollout strategy (% rollout and a `minimumVersion` version gate).

### 5) Optional: activity list "All networks" filter

If the chain must appear under the "All networks" activity/home filter and be enabled by default, add its hex chain ID to `POPULAR_NETWORKS` in `@metamask/network-enablement-controller`. This is an upstream `core` change requiring a package release and dependency bump. Omit if the chain should not be a default-enabled popular network.

## Validation Checklist

Before finishing, verify:

- The chain ID is present in `@metamask/bridge-controller`'s `ALLOWED_BRIDGE_CHAIN_IDS`.
- `ALLOWED_EVM_BRIDGE_CHAIN_IDS` includes the new chain.
- `NETWORK_TO_SHORT_NETWORK_NAME_MAP` has both hex and CAIP entries.
- `BRIDGE_CHAINID_COMMON_TOKEN_PAIR` has the default destination token with correct decimals and a checksummed `assetId`.
- `STABLECOIN_ASSET_IDS` includes the chain's stablecoins.
- The `bridgeConfigV2` flag has both a `chains` entry and a `chainRanking` entry.
- The chain surfaces in `getFromChains`/`getToChains` only when present in both the allowlist and `chainRanking`.
- Stablecoin pairs on the chain resolve to 0.5% slippage.

## Test Guidance

Add or update coverage in the closest existing suites:

- `ui/ducks/bridge/selectors.test.ts` — verify the chain appears in `getFromChains`/`getToChains` when present in both `chainRanking` and the allowlist. Update the fallback test count and inline snapshot (`returns all supported chains when bridgeFeatureFlags are not set`) if the default chain ranking count changes.
- `ui/hooks/bridge/useSmartSlippage.test.ts` — verify 0.5% slippage for a stablecoin-to-stablecoin pair on the new chain.

Run targeted tests:

```bash
yarn test:unit ui/ducks/bridge/selectors.test.ts ui/hooks/bridge/useSmartSlippage.test.ts
```

If snapshots change intentionally, review the diff before updating.

## Dependency Housekeeping

Only if `@metamask/bridge-controller` (or another dependency) was bumped:

```bash
yarn dedupe
```

## Required Agent Response Sections

When using this standard, return:

1. `Prerequisites Check`
2. `Implementation Checklist`
3. `Files Changed`
4. `Remote Flag Changes`
5. `Tests Run`
6. `Remaining Gaps`
