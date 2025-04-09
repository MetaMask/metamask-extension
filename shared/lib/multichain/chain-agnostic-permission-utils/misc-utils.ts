import type {
  NormalizedScopesObject,
  Caip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import {
  Caip25CaveatType,
  KnownSessionProperties,
  parseScopeString,
} from '@metamask/chain-agnostic-permission';
import type { CaipNamespace } from '@metamask/utils';

// @metamask/chain-agnostic-permission -> scopes/constants.ts
/**
 * Checks if a given value is a known session property.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a known session property, otherwise `false`.
 */
export function isKnownSessionPropertyValue(
  value: string,
): value is KnownSessionProperties {
  return Object.values(KnownSessionProperties).includes(
    value as KnownSessionProperties,
  );
}

// @metamask/chain-agnostic-permission -> scopes/authorization.ts
/**
 * Checks if a given CAIP namespace is present in a NormalizedScopesObject.
 *
 * @param scopesObject - The NormalizedScopesObject to check.
 * @param caipNamespace - The CAIP namespace to check for.
 * @returns true if the CAIP namespace is present in the NormalizedScopesObject, false otherwise.
 */
export function isNamespaceInScopesObject(
  scopesObject: NormalizedScopesObject,
  caipNamespace: CaipNamespace,
) {
  return Object.keys(scopesObject).some((scope) => {
    const { namespace } = parseScopeString(scope);
    return namespace === caipNamespace;
  });
}

// @metamask/chain-agnostic-permission -> caip25Permission.ts
/**
 * Helper to get the CAIP-25 caveat from a permission
 *
 * @param caip25Permission - The CAIP-25 permission object
 * @param caip25Permission.caveats - The caveats of the CAIP-25 permission
 * @returns The CAIP-25 caveat or undefined if not found
 */
export function getCaip25CaveatFromPermission(caip25Permission: {
  caveats: {
    type: string;
    value: Caip25CaveatValue | undefined;
  }[];
}):
  | {
      type: string;
      value: Caip25CaveatValue | undefined;
    }
  | undefined {
  return caip25Permission?.caveats?.find(
    (caveat) => caveat.type === Caip25CaveatType,
  );
}
