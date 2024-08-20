import { Hex } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { Caip25CaveatValue } from './caip25permissions';
import {
  KnownCaipNamespace,
  mergeScopes,
  parseScopeString,
  ScopesObject,
  validNotifications,
  validRpcMethods,
} from './scope';

export const getPermittedEthChainIds = (
  caip25CaveatValue: Caip25CaveatValue,
) => {
  const ethChainIds: Hex[] = [];
  const sessionScopes = mergeScopes(
    caip25CaveatValue.requiredScopes,
    caip25CaveatValue.optionalScopes,
  );

  Object.keys(sessionScopes).forEach((scopeString) => {
    const { namespace, reference } = parseScopeString(scopeString);
    if (namespace === KnownCaipNamespace.Eip155 && reference) {
      ethChainIds.push(toHex(reference));
    }
  });

  return Array.from(new Set(ethChainIds));
};

export const addPermittedEthChainId = (
  caip25CaveatValue: Caip25CaveatValue,
  chainId: Hex,
) => {
  const scopeString = `eip155:${parseInt(chainId, 16)}`;
  if (
    Object.keys(caip25CaveatValue.requiredScopes).includes(scopeString) ||
    Object.keys(caip25CaveatValue.optionalScopes).includes(scopeString)
  ) {
    return caip25CaveatValue;
  }

  caip25CaveatValue.optionalScopes[scopeString] = {
    methods: validRpcMethods,
    notifications: validNotifications,
    accounts: [], // Should this be empty?
  };

  // Should we cloning this rather than modifying it in-place?
  return caip25CaveatValue;
};

// Should this deep clone rather than modify in-place?
const filterEthScopesObjectByChainId = (
  scopesObject: ScopesObject,
  chainIds: Hex[],
) => {
  Object.keys(scopesObject).forEach((scopeString) => {
    const { namespace, reference } = parseScopeString(scopeString);
    if (!reference) {
      return;
    }
    const chainId = toHex(reference);
    if (
      namespace === KnownCaipNamespace.Eip155 &&
      !chainIds.includes(chainId)
    ) {
      delete scopesObject[scopeString];
    }
  });
};

export const setPermittedEthChainIds = (
  caip25CaveatValue: Caip25CaveatValue,
  chainIds: Hex[],
) => {
  filterEthScopesObjectByChainId(caip25CaveatValue.requiredScopes, chainIds);
  filterEthScopesObjectByChainId(caip25CaveatValue.optionalScopes, chainIds);

  chainIds.forEach((chainId) => {
    const scopeString = `eip155:${parseInt(chainId, 16)}`;

    if (
      Object.keys(caip25CaveatValue.requiredScopes).includes(scopeString) ||
      Object.keys(caip25CaveatValue.optionalScopes).includes(scopeString)
    ) {
      return;
    }

    caip25CaveatValue.optionalScopes[scopeString] = {
      methods: validRpcMethods,
      notifications: validNotifications,
      accounts: [], // Should this be empty?
    };
  });
};
