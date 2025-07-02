import {
  Caip25CaveatValue,
  setNonSCACaipAccountIdsInCaip25CaveatValue,
  setChainIdsInCaip25CaveatValue,
  getCaipAccountIdsFromCaip25CaveatValue,
  getAllScopesFromCaip25CaveatValue,
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
