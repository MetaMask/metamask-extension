import {
  Caip25CaveatValue,
  setNonSCACaipAccountIdsInCaip25CaveatValue,
  setChainIdsInCaip25CaveatValue,
  getCaipAccountIdsFromCaip25CaveatValue,
  getAllScopesFromCaip25CaveatValue,
} from '@metamask/chain-agnostic-permission';

/**
 * TODO: Isolate the merger function from @metamask/chain-agnostic-permissions and reuse it here
 *
 * Merges two Caip25CaveatValue objects using the official @metamask/chain-agnostic-permission utilities.
 *

 * @param first - The first Caip25CaveatValue to merge
 * @param second - The second Caip25CaveatValue to merge
 * @returns A new Caip25CaveatValue with merged data
 */
export function mergeCaip25CaveatValues(
  first: Caip25CaveatValue,
  second: Caip25CaveatValue,
): Caip25CaveatValue {
  // Get all accounts from both caveat values
  const firstAccounts = getCaipAccountIdsFromCaip25CaveatValue(first);
  const secondAccounts = getCaipAccountIdsFromCaip25CaveatValue(second);

  // Combine and deduplicate accounts
  const mergedAccounts = Array.from(
    new Set([...firstAccounts, ...secondAccounts]),
  );

  // Get all chain IDs from both caveat values
  const firstChainIds = getAllScopesFromCaip25CaveatValue(first);
  const secondChainIds = getAllScopesFromCaip25CaveatValue(second);

  // Combine and deduplicate chain IDs
  const mergedChainIds = Array.from(
    new Set([...firstChainIds, ...secondChainIds]),
  );

  // Start with the first caveat value as base
  let mergedCaveatValue = { ...first };

  // Merge session properties
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
