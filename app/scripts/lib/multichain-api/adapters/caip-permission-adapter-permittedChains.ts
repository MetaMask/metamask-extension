import { Hex, KnownCaipNamespace } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { Caip25CaveatValue } from '../caip25permissions';
import {
  KnownNotifications,
  KnownRpcMethods,
  mergeScopes,
  parseScopeString,
  ScopesObject,
  ScopeString,
} from '../scope';

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

  return {
    ...caip25CaveatValue,
    optionalScopes: {
      ...caip25CaveatValue.optionalScopes,
      [scopeString]: {
        methods: KnownRpcMethods.eip155,
        notifications: KnownNotifications.eip155,
        accounts: [],
      },
    },
  };
};

const filterEthScopesObjectByChainId = (
  scopesObject: ScopesObject,
  chainIds: Hex[],
) => {
  const updatedScopesObject: ScopesObject = {};

  Object.entries(scopesObject).forEach(([scopeString, scopeObject]) => {
    const { namespace, reference } = parseScopeString(scopeString);
    if (!reference) {
      updatedScopesObject[scopeString as ScopeString] = scopeObject;
      return;
    }
    if (namespace === KnownCaipNamespace.Eip155) {
      const chainId = toHex(reference);
      if (chainIds.includes(chainId)) {
        updatedScopesObject[scopeString as ScopeString] = scopeObject;
      }
    } else {
      updatedScopesObject[scopeString as ScopeString] = scopeObject;
    }
  });

  return updatedScopesObject;
};

export const setPermittedEthChainIds = (
  caip25CaveatValue: Caip25CaveatValue,
  chainIds: Hex[],
) => {
  let updatedCaveatValue: Caip25CaveatValue = {
    ...caip25CaveatValue,
    requiredScopes: filterEthScopesObjectByChainId(
      caip25CaveatValue.requiredScopes,
      chainIds,
    ),
    optionalScopes: filterEthScopesObjectByChainId(
      caip25CaveatValue.optionalScopes,
      chainIds,
    ),
  };

  chainIds.forEach((chainId) => {
    updatedCaveatValue = addPermittedEthChainId(updatedCaveatValue, chainId);
  });

  return updatedCaveatValue;
};
