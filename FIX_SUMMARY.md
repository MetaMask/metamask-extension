# Fix Summary: Invalid Chain ID Error (METAMASK-XNSZ)

## Problem
When a dapp (e.g., https://kaito.ai) requested permissions including an unconfigured chain ID (e.g., "0x18c6"), MetaMask would crash with an "Invalid chain ID" error. This occurred because:

1. The dapp requested permissions via `wallet_requestPermissions` with a chain ID not configured in MetaMask
2. PermissionController granted these permissions without validating chain existence
3. When permissions changed, MetamaskController tried to switch to the unconfigured chain
4. NetworkController.findNetworkClientIdByChainId() threw an error because the chain didn't exist

## Root Cause
In `app/scripts/metamask-controller.js`, the subscription handler for `PermissionController:stateChange` attempted to switch networks without first validating that the target chain ID was configured in the NetworkController.

## Solution
Added a defensive check before attempting network switch:

```javascript
// Check if the chain ID exists in the NetworkController before attempting to switch
const targetChainConfig =
  this.networkController.getNetworkConfigurationByChainId(chains[0]);

if (!targetChainConfig) {
  log.warn(
    `Cannot switch to chain ID "${chains[0]}" for origin "${origin}": chain is not configured in MetaMask. Please add the network first.`,
  );
  continue;
}
```

## Changes Made
- **File**: `app/scripts/metamask-controller.js`
- **Lines**: 1994-2005
- **Type**: Defensive validation check

## Testing
- ✅ All existing unit tests pass (166 tests)
- ✅ TypeScript type checking passes
- ✅ ESLint passes
- ✅ No regressions detected

## Behavior
### Before Fix
- Dapp requests permissions with unconfigured chain → **MetaMask crashes** with "Invalid chain ID" error

### After Fix
- Dapp requests permissions with unconfigured chain → MetaMask logs warning and **gracefully skips network switch**
- Dapp requests permissions with configured chain → **Normal operation** (no behavior change)

## Edge Cases Handled
1. ✅ Unconfigured chain ID → logs warning and skips
2. ✅ Configured chain ID → proceeds normally
3. ✅ Empty chains array → skipped by existing `chains.length > 0` check
4. ✅ Current chain in permitted chains → skipped by existing `!chains.includes(currentChainIdForOrigin)` check

## Impact
- Prevents crashes when dapps request permissions for unconfigured chains
- Maintains backward compatibility with existing functionality
- Provides clear logging for debugging
