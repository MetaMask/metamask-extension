# Playbook: MetaMask/metamask-extension

This is an evolving memory playbook. Rules are structured as itemized bullets with unique IDs to allow for incremental updates and to prevent "context collapse".

## Updating Memory

If you have reflections, please notify user and provide a small backtick code block and I'll update the memory changes.

## Selector / Asset-Selector Refactors (REF)

When removing asset-selector dependencies or narrowing selector chains (e.g. for unconnected-account-alert, connected-accounts, dapp selectors):

- **[ref-001] Fix the shared chain first**: Prefer changing the existing selector’s dependencies (e.g. `getInternalAccounts` instead of `getMetaMaskAccounts`) so all consumers stop pulling assets. Add a new “account-only” selector only when some consumers need balance and others do not.
- **[ref-002] Enrich in the selector once**: If multiple consumers do the same mapping (e.g. adding `name` from internal accounts), do it once in the selector and remove the duplicate logic from each consumer.
- **[ref-003] Update all consumers in one pass**: Find every consumer of the selector and remove the same redundant pattern in the same PR.
- **[ref-004] Sync tests and stories**: When the selector’s return shape changes, update selector tests, component tests, and Storybook mocks/PropTypes in the same change set.
- **[ref-005] Tighten JSDoc**: When changing selector logic or return shape, add or update JSDoc types on inputs and return values.
