# Recipe run: Refactor parity — PR #42441 selector hoist

**PR:** https://github.com/MetaMask/metamask-extension/pull/42441
**Result:** ❌ FAIL
**Run at:** 2026-05-07T23:00:54.294Z

## Node results

| Node | Status | Duration | Note |
|------|--------|----------|------|
| `cycles` | ❌ FAIL | 1063ms | shared/lib/selectors/** must not appear in any cycle (9→0 on this PR) |
| `boundary` | ❌ FAIL | 32ms | No eslint-disable bypass of the shared→ui import boundary should remain |
| `parity` | ❌ FAIL | 1798ms | All moved selectors must be structurally identical to their originals (AST body, modulo locations/comments) |
| `tsc` | ❌ FAIL | 45687ms | TypeScript must be clean across the full project |
| `tests` | ❌ FAIL | 62679ms | Tests on directly touched modules must pass |

## Failures

### `cycles`

**stderr:**
```
command not found: tsx

```

### `boundary`

```
shared/lib/selectors/account.ts:// eslint-disable-next-line import-x/no-restricted-paths
shared/lib/selectors/smart-transactions.ts:  // eslint-disable-next-line import-x/no-restricted-paths
shared/lib/selectors/smart-transactions.ts:  // eslint-disable-next-line import-x/no-restricted-paths
shared/lib/selectors/index.ts:// eslint-disable-next-line import-x/no-restricted-paths

```

### `parity`

```

Parity check: main → HEAD
Manifest: development/parity-check/pr-42441-moves.json (12 symbols)

  ✗ getSelectedInternalAccount  [MISSING on new] shared/lib/selectors/accounts.ts
  ✗ getMaybeSelectedInternalAccount  [MISSING on new] shared/lib/selectors/accounts.ts
  ✗ AccountsState  [MISSING on new] shared/lib/selectors/accounts.ts
  ✗ getCurrentKeyring  [MISSING on new] shared/lib/selectors/keyring.ts
  ✗ getAccountType  [MISSING on new] shared/lib/selectors/keyring.ts
  ✗ getAccountTypeForKeyring  [MISSING on new] shared/lib/selectors/keyring.ts
  ✗ isHardwareWallet  [MISSING on new] shared/lib/selectors/keyring.ts
  ✗ getHardwareWalletType  [MISSING on new] shared/lib/selectors/keyring.ts
  ✗ accountSupportsSmartTx  [MISSING on new] shared/lib/selectors/keyring.ts
  ✗ getPreferences  [MISSING on new] shared/lib/selectors/preferences.ts
  ✗ getRemoteFeatureFlags  [MISSING on new] shared/lib/selectors/remote-feature-flags.ts
  ✗ RemoteFeatureFlagsState  [MISSING on new] shared/lib/sel
```

### `tsc`

```
app/scripts/controllers/metametrics-controller.ts(1404,54): error TS2345: Argument of type '(collection: string | object | null | undefined) => number' is not assignable to parameter of type '(value: unknown, index: number, array: unknown[]) => number'.
  Types of parameters 'collection' and 'value' are incompatible.
    Type 'unknown' is not assignable to type 'string | object | null | undefined'.
app/scripts/controllers/metametrics-controller.ts(1417,39): error TS18046: 'networkConfiguration' is of type 'unknown'.
app/scripts/controllers/metametrics-controller.ts(1421,17): error TS2769: No overload matches this call.
  Overload 1 of 2, '(predicate: (value: unknown, index: number, array: unknown[]) => value is unknown, thisArg?: any): unknown[]', gave the following error.
    Argument of type '({ nativeCurrency }: { nativeCurrency: any; }) => boolean' is not assignable to parameter of type '(value: unknown, index: number, array: unknown[]) => value is unknown'.
      Types of paramete
```

### `tests`

```


════════════════════════════════════════════════════════════════════════════════
  Console Baseline Report (Per-File)
════════════════════════════════════════════════════════════════════════════════

📋 NEW FILES (not in baseline)

  The following test files are not in the baseline yet:

  📁 ui/ducks/ramps/ramps.test.ts
     Total warnings: 1
       • warn: ImmutableStateInvariantMiddleware took 45ms, which is: 1

  💡 Run "yarn test:unit:update-baseline" to add these files to baseline.


✨ CONSOLE IMPROVEMENTS DETECTED

  Great job! The following warnings were reduced:

  📁 ui/selectors/assets.test.ts
     🎉 FIXED: warn: No tokens found for chainId:
        All 1 occurrences eliminated!

  📁 ui/hooks/useHardwareWalletRecoveryLocation.test.tsx
     🎉 FIXED: Reselect: Identity function warnings
        All 1 occurrences eliminated!

  💡 To lock in improvements:
     - Edit baseline manually, OR
     - Run yarn test:unit:update-baseline:strict (allows decreases - use with caution
```

**stderr:**
```
PASS shared/lib/selectors/assets-migration.test.ts (5.167 s)
PASS ui/selectors/transactions.test.js (5.917 s)
PASS ui/selectors/multichain/networks.test.ts
PASS ui/selectors/gator-permissions/gator-permissions.test.ts (11.182 s)
PASS ui/selectors/selectors.test.js (11.234 s)
PASS ui/selectors/multichain-accounts/account-tree.test.ts (11.252 s)
PASS ui/ducks/swaps/swaps.test.js (5.494 s)
PASS ui/selectors/assets.test.ts (11.71 s)
PASS ui/hooks/useAccountGroupForPermissions.test.ts (11.781 s)
PASS ui/hooks/rewards/useLinkAccountGroup.test.tsx (12.151 s)
PASS ui/hooks/rewards/useCandidateSubscriptionId.test.ts (12.268 s)
PASS ui/hooks/bridge/useRewards.test.ts (12.273 s)
PASS ui/ducks/bridge/selectors.test.ts (12.361 s)
PASS ui/hooks/gator-permissions/useRevokeGatorPermissions.test.tsx (5.767 s)
PASS ui/hooks/rewards/usePrimaryWalletGroupAccounts.test.ts
PASS ui/selectors/perps-controller.test.ts
PASS ui/selectors/permissions.test.js
PASS ui/selectors/multichain.test.ts
PASS ui/ducks/meta
```
