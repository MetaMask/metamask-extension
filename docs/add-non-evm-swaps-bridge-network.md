# Add Non-EVM Swaps/Bridge Network

## Use This Standard When

- A task asks to add a new non-EVM network to bridge or swaps.
- The request mentions chain ID allowlists, bridge constants, account detection, destination account checks, or send type resolution.
- The rollout needs both code-gated and LaunchDarkly-controlled behavior.

## Prerequisites

Confirm all are true before implementation:

- Wallet snap exists for the target network.
- `@metamask/bridge-controller` supports the target network.
- Account type support exists in `@metamask/keyring-api`.
- Base network support already exists throughout the extension.

If any prerequisite is missing, stop and report the blocker instead of partially wiring the feature.

## Reference Implementations

- Tron: `https://github.com/MetaMask/metamask-extension/pull/37683`
- Bitcoin: `https://github.com/MetaMask/metamask-extension/pull/35597`

Review both PRs before coding to mirror existing patterns and naming.

## Agent Skill Entrypoints

Use these entrypoints:

- SSOT policy + execution standard: this document
- OpenAI/Codex skill entrypoint: `.agents/skills/add-non-evm-swaps-bridge-network/SKILL.md` (`$add-non-evm-swaps-bridge-network`)
- Cursor skill entrypoint: `.cursor/skills/add-non-evm-swaps-bridge-network/SKILL.md`
- Claude skill entrypoint: `.claude/skills/add-non-evm-swaps-bridge-network/SKILL.md`
- Claude command entrypoint: `.claude/commands/add-non-evm-swaps-bridge-network.md`
- Cursor command entrypoint: `.cursor/commands/add-non-evm-swaps-bridge-network.md`
- Windsurf and other harnesses: start prompts with `Follow docs/add-non-evm-swaps-bridge-network.md section "Agent Execution Standard (SSOT)".`

## Agent Execution Standard (SSOT)

For agent implementation or review tasks, follow this workflow exactly:

1. Confirm the prerequisites are satisfied. If not, stop and report the blocker.
2. Review the Tron and Bitcoin reference PRs before making edits.
3. Update the code-gated bridge constants in `shared/constants/bridge.ts`.
4. Update the relevant UI and state files for account detection, account compatibility, address validation, send type, and token filtering.
5. Apply both rollout controls together: the build-time code gate and the LaunchDarkly `bridge-config` targeting.
6. Validate that the network stays hidden when the code gate is off, and only appears in allowed LaunchDarkly environments when the code gate is on.
7. Run targeted tests for changed areas and note any remaining gaps.

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
  - Update `getFromChains` filtering to include or exclude the network correctly.
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

- Code gate (build-time gate, for example via builds config)
- LaunchDarkly flag targeting through `bridge-config`

Important behavior:

- LaunchDarkly enables granular environment targeting.
- The code gate prevents accidental exposure when the feature is not released globally.
- Do not rely on only one of the two controls.

## Validation Checklist

Before finishing, verify:

- The network is absent when the code gate is off.
- The network only appears in environments targeted by LaunchDarkly when the code gate is on.
- The from-chain list only includes the network when the required account or accounts exist.
- The destination account picker blocks incompatible account types.
- External address validation enforces network-specific format rules.
- The send confirmation path resolves to the correct send type.
- Token or resource filtering excludes non-tradeable assets where applicable.

## Test Guidance

Run targeted tests for changed areas, then broader bridge or swaps coverage:

- Unit tests for modified selectors, hooks, or utils.
- Unit or integration tests for bridge account picker and send type changes.
- E2E swaps or bridge flows for the new network path and regressions in existing networks.

If behavior changes, add or update tests in the closest existing test suites.

## Required Agent Response Sections

When using this standard, return:

1. `Prerequisites Check`
2. `Implementation Checklist`
3. `Files Changed`
4. `Gating Behavior Verified`
5. `Tests Run`
6. `Remaining Gaps`
