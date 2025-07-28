import {
  Caip25CaveatValue,
  setNonSCACaipAccountIdsInCaip25CaveatValue,
  setChainIdsInCaip25CaveatValue,
  getCaipAccountIdsFromCaip25CaveatValue,
  getAllScopesFromCaip25CaveatValue,
  Caip25EndowmentPermissionName,
  Caip25CaveatType,
} from '@metamask/chain-agnostic-permission';

/**
 * TODO: Isolate the merger function from @metamask/chain-agnostic-permissions and reuse it here
 * See https://github.com/MetaMask/MetaMask-planning/issues/5113
 *
 * Merges two Caip25CaveatValue objects
 *
 * @param first - The first Caip25CaveatValue to merge
 * @param second - The second Caip25CaveatValue to merge
 * @returns A new Caip25CaveatValue with merged data
 */
export function mergeCaip25CaveatValues(
  first: Caip25CaveatValue,
  second: Caip25CaveatValue,
): Caip25CaveatValue {
  const firstAccounts = getCaipAccountIdsFromCaip25CaveatValue(first);
  const secondAccounts = getCaipAccountIdsFromCaip25CaveatValue(second);

  const mergedAccounts = Array.from(
    new Set([...firstAccounts, ...secondAccounts]),
  );

  const firstChainIds = getAllScopesFromCaip25CaveatValue(first);
  const secondChainIds = getAllScopesFromCaip25CaveatValue(second);

  const mergedChainIds = Array.from(
    new Set([...firstChainIds, ...secondChainIds]),
  );

  let mergedCaveatValue = { ...first };

  mergedCaveatValue.sessionProperties = {
    ...first.sessionProperties,
    ...second.sessionProperties,
  };

  mergedCaveatValue.isMultichainOrigin =
    first.isMultichainOrigin || second.isMultichainOrigin;

  mergedCaveatValue = setChainIdsInCaip25CaveatValue(
    mergedCaveatValue,
    mergedChainIds,
  );

  mergedCaveatValue = setNonSCACaipAccountIdsInCaip25CaveatValue(
    mergedCaveatValue,
    mergedAccounts,
  );

  return mergedCaveatValue;
}

/**
 * Converts a diff map format to a standard permission object format.
 * The diff map has a nested structure: diffMap?.[Caip25EndowmentPermissionName]?.[Caip25CaveatType]?.Caip25CaveatValue
 * This is different from the standard permission object format which has caveats array.
 *
 * @param diffMap - The diff map with nested `endowment:caip25` permission specification
 * @param diffMap.Caip25EndowmentPermissionName - The permission name key containing the caveat type
 * @param diffMap.Caip25EndowmentPermissionName.Caip25CaveatType - The caveat type key containing the caveat value
 * @returns An `endowment:caip25` permission object with proper caveats structure
 */
export function getPermissionsFromDiffMap(diffMap: {
  [Caip25EndowmentPermissionName]: { [Caip25CaveatType]: Caip25CaveatValue };
}) {
  const caveatValue =
    diffMap?.[Caip25EndowmentPermissionName]?.[Caip25CaveatType];
  return {
    [Caip25EndowmentPermissionName]: {
      caveats: [
        {
          type: Caip25CaveatType,
          value: caveatValue,
        },
      ],
    },
  };
}
