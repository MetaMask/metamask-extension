---
name: add-non-evm-swaps-bridge-network
description: Adds and validates non-EVM network support for the extension Swaps/Bridge client. Use when implementing networks like Tron or Bitcoin across bridge constants, account selectors, send type resolution, address validation, and LaunchDarkly plus code-gate rollout.
---

# Add Non-EVM Network to Swaps/Bridge

## Use This Skill When

- A task asks to add a new non-EVM network to bridge or swaps.
- The request mentions chain ID allowlists, bridge constants, account detection, destination account checks, or send type.
- The rollout needs both code-gated and LaunchDarkly-controlled behavior.

## Prerequisites

Confirm all are true before implementation:

- Wallet snap exists for the target network.
- `@metamask/bridge-controller` supports the target network.
- Account type support exists in `@metamask/keyring-api`.
- Base network support already exists throughout the extension.

## Reference Implementations

- Tron: `https://github.com/MetaMask/metamask-extension/pull/37683`
- Bitcoin: `https://github.com/MetaMask/metamask-extension/pull/35597`

Review both PRs before coding to mirror existing patterns and naming.

## Implementation Checklist

### 1) Code-gated constants update (required)

File:

- `shared/constants/bridge.ts`

Update all relevant entries for the new network:

- `ALLOWED_MULTICHAIN_BRIDGE_CHAIN_IDS`
- `ALLOWED_BRIDGE_CHAIN_IDS`
- `NETWORK_TO_SHORT_NETWORK_NAME_MAP`
- `BRIDGE_CHAINID_COMMON_TOKEN_PAIR`

Keep naming and ordering consistent with existing networks in the file.

### 2) Ungated UI and state updates

Update these files:

- `ui/ducks/bridge/selectors.ts`
  - Add `has<Network>Accounts` selector.
  - Update `getFromChains` filtering to include/exclude the network correctly.
- `ui/ducks/bridge/utils.ts`
  - Export `is<Network>ChainId` helper if no shared helper exists.
- `ui/pages/bridge/prepare/components/destination-account-picker-modal.tsx`
  - Add destination account compatibility checks for the network.
- `ui/pages/bridge/hooks/useExternalAccountResolution.ts`
  - Add network-specific address validation.
- `ui/pages/confirmations/hooks/send/useSendType.ts`
  - Add send type handling for the network.
- `ui/selectors/multichain.ts`
  - Add relevant testnet chain IDs to multichain detection logic.
- `ui/hooks/bridge/useTokensWithFiltering.ts`
  - Filter out non-tradeable resources for this network when applicable.

### 3) Gating and rollout model

Apply both controls together:

- Code gate (build-time gate, e.g., builds config)
- LaunchDarkly flag (`bridge-config`) targeting

Important behavior:

- LaunchDarkly enables granular environment targeting.
- Code gate prevents accidental exposure when the feature is not released globally.
- Do not rely on only one of the two controls.

## Validation Checklist

Before finishing, verify:

- Network is absent when code gate is off.
- Network only appears in environments targeted by LaunchDarkly when code gate is on.
- From-chain list only includes network when required account(s) exist.
- Destination account picker blocks incompatible account types.
- External address validation enforces network-specific format rules.
- Send confirmation path resolves to the correct send type.
- Token/resource filtering excludes non-tradeable assets where applicable.

## Test Guidance

Run targeted tests for changed areas, then broader bridge/swaps coverage:

- Unit tests for modified selectors/hooks/utils.
- Unit/integration tests for bridge account picker and send type changes.
- E2E swaps/bridge flows for the new network path and regressions in existing networks.

If behavior changes, add or update tests in the closest existing test suites.

## Output Expectations for Agents

When using this skill, return:

- Exact files changed
- Why each file changed
- Gating behavior verified (code gate + LaunchDarkly)
- Tests run and remaining gaps
