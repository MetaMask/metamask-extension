import { CaveatMutatorOperation } from '@metamask/permission-controller';
import { CaveatTypes } from '../../../../shared/constants/permissions';
import { normalizeSafeAddress } from '../../lib/multichain/address';

/**
 * Factories that construct caveat mutator functions that are passed to
 * PermissionController.updatePermissionsByCaveat.
 */
export const CaveatMutatorFactories = {
  [CaveatTypes.restrictReturnedAccounts]: {
    removeAccount,
  },
  [CaveatTypes.restrictNetworkSwitching]: {
    removeChainId,
  },
};

/**
 * Removes the target account from the value arrays of all
 * `restrictReturnedAccounts` caveats. No-ops if the target account is not in
 * the array, and revokes the parent permission if it's the only account in
 * the array.
 *
 * @param {string} targetAccount - The address of the account to remove from
 * all accounts permissions.
 * @param {string[]} existingAccounts - The account address array from the
 * account permissions.
 */
function removeAccount(targetAccount, existingAccounts) {
  const checkSumTargetAccount = normalizeSafeAddress(targetAccount);
  const newAccounts = existingAccounts.filter(
    (address) => normalizeSafeAddress(address) !== checkSumTargetAccount,
  );

  if (newAccounts.length === existingAccounts.length) {
    return { operation: CaveatMutatorOperation.Noop };
  } else if (newAccounts.length > 0) {
    return {
      operation: CaveatMutatorOperation.UpdateValue,
      value: newAccounts,
    };
  }
  return { operation: CaveatMutatorOperation.RevokePermission };
}

/**
 * Removes the target chain ID from the value arrays of all
 * `restrictNetworkSwitching` caveats. No-ops if the target chain ID is not in
 * the array, and revokes the parent permission if it's the only chain ID in
 * the array.
 *
 * @param {string} targetChainId - The chain ID to remove from
 * all network switching permissions.
 * @param {string[]} existingChainIds - The chain ID array from the
 * network switching permissions.
 */
function removeChainId(targetChainId, existingChainIds) {
  const newChainIds = existingChainIds.filter(
    (chainId) => chainId !== targetChainId,
  );

  if (newChainIds.length === existingChainIds.length) {
    return { operation: CaveatMutatorOperation.Noop };
  } else if (newChainIds.length > 0) {
    return {
      operation: CaveatMutatorOperation.UpdateValue,
      value: newChainIds,
    };
  }
  return { operation: CaveatMutatorOperation.RevokePermission };
}
