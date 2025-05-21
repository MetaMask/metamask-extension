import {
  Caip25CaveatType,
  Caip25CaveatValue,
  InternalScopesObject,
  InternalScopeString,
  parseScopeString,
} from '@metamask/chain-agnostic-permission';
import {
  CaipChainId,
  CaipNamespace,
  KnownCaipNamespace,
} from '@metamask/utils';

/**
 * Gets all scopes from a CAIP-25 caveat value
 *
 * @param scopesObjects - The scopes objects to get the scopes from.
 * @returns An array of InternalScopeStrings.
 */
export function getAllScopesFromScopesObjects(
  scopesObjects: InternalScopesObject[],
): InternalScopeString[] {
  const scopeSet = new Set<InternalScopeString>();

  for (const scopeObject of scopesObjects) {
    for (const key of Object.keys(scopeObject)) {
      scopeSet.add(key as InternalScopeString);
    }
  }

  return Array.from(scopeSet);
}

/**
 * Gets all scopes (chain IDs) from a CAIP-25 caveat
 * This extracts all scopes from both required and optional scopes
 * and returns a unique set.
 *
 * @param caip25CaveatValue - The CAIP-25 caveat value to extract scopes from
 * @returns Array of unique scope strings (chain IDs)
 */
export function getAllScopesFromCaip25CaveatValue(
  caip25CaveatValue: Caip25CaveatValue,
): CaipChainId[] {
  return getAllScopesFromScopesObjects([
    caip25CaveatValue.requiredScopes,
    caip25CaveatValue.optionalScopes,
  ]) as CaipChainId[];
}

/**
 * Gets all non-wallet namespaces from a CAIP-25 caveat value
 * This extracts all namespaces from both required and optional scopes
 * and returns a unique set.
 *
 * @param caip25CaveatValue - The CAIP-25 caveat value to extract namespaces from
 * @returns Array of unique namespace strings
 */
export function getAllNonWalletNamespacesFromCaip25CaveatValue(
  caip25CaveatValue: Caip25CaveatValue,
): CaipNamespace[] {
  const allScopes = getAllScopesFromCaip25CaveatValue(caip25CaveatValue);
  const namespaceSet = new Set<CaipNamespace>();

  for (const scope of allScopes) {
    const { namespace, reference } = parseScopeString(scope);
    if (namespace === KnownCaipNamespace.Wallet) {
      if (reference) {
        namespaceSet.add(reference);
      }
    } else if (namespace) {
      namespaceSet.add(namespace);
    }
  }

  return Array.from(namespaceSet);
}

/**
 * Gets all scopes (chain IDs) from a CAIP-25 permission
 * This extracts all scopes from both required and optional scopes
 * and returns a unique set.
 *
 * @param caip25Permission - The CAIP-25 permission object
 * @param caip25Permission.caveats - The caveats of the CAIP-25 permission
 * @returns Array of unique scope strings (chain IDs)
 */
export function getAllScopesFromPermission(caip25Permission: {
  caveats: {
    type: string;
    value: Caip25CaveatValue;
  }[];
}): CaipChainId[] {
  const caip25Caveat = caip25Permission.caveats.find(
    (caveat) => caveat.type === Caip25CaveatType,
  );
  if (!caip25Caveat) {
    return [];
  }

  return getAllScopesFromCaip25CaveatValue(caip25Caveat.value);
}
