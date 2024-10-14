import {
  CaipAccountId,
  Hex,
  KnownCaipNamespace,
  parseCaipAccountId,
} from '@metamask/utils';
import { Caip25CaveatValue } from '../caip25permissions';
import {
  mergeScopes,
  parseScopeString,
  ScopesObject,
  ScopeString,
} from '../scope';

const isEip155ScopeString = (scopeString: ScopeString) => {
  const { namespace, reference } = parseScopeString(scopeString);

  return (
    namespace === KnownCaipNamespace.Eip155 ||
    (namespace === KnownCaipNamespace.Wallet &&
      reference === KnownCaipNamespace.Eip155)
  );
};

export const getEthAccounts = (caip25CaveatValue: Caip25CaveatValue) => {
  const ethAccounts: string[] = [];
  const sessionScopes = mergeScopes(
    caip25CaveatValue.requiredScopes,
    caip25CaveatValue.optionalScopes,
  );

  Object.entries(sessionScopes).forEach(([_, { accounts }]) => {
    accounts?.forEach((account) => {
      const { address, chainId } = parseCaipAccountId(account);

      if (isEip155ScopeString(chainId)) {
        ethAccounts.push(address);
      }
    });
  });

  return Array.from(new Set(ethAccounts));
};

const setEthAccountsForScopesObject = (
  scopesObject: ScopesObject,
  accounts: Hex[],
) => {
  const updatedScopesObject: ScopesObject = {};

  Object.entries(scopesObject).forEach(([scopeString, scopeObject]) => {
    const { namespace, reference } = parseScopeString(scopeString);

    const isWalletNamespace =
      namespace === KnownCaipNamespace.Wallet && reference === undefined;

    if (
      !isEip155ScopeString(scopeString as ScopeString) &&
      !isWalletNamespace
    ) {
      updatedScopesObject[scopeString as ScopeString] = scopeObject;
      return;
    }

    const caipAccounts = accounts.map(
      (account) =>
        (isWalletNamespace
          ? `wallet:eip155:${account}`
          : `${scopeString}:${account}`) as CaipAccountId,
    );

    updatedScopesObject[scopeString as ScopeString] = {
      ...scopeObject,
      accounts: caipAccounts,
    };
  });

  return updatedScopesObject;
};

// This helper must be called with existing eip155 scopes
export const setEthAccounts = (
  caip25CaveatValue: Caip25CaveatValue,
  accounts: Hex[],
) => {
  return {
    ...caip25CaveatValue,
    requiredScopes: setEthAccountsForScopesObject(
      caip25CaveatValue.requiredScopes,
      accounts,
    ),
    optionalScopes: setEthAccountsForScopesObject(
      {
        wallet: {
          methods: [],
          notifications: [],
        },
        'wallet:eip155': {
          methods: [],
          notifications: [],
        },
        ...caip25CaveatValue.optionalScopes,
      },
      accounts,
    ),
  };
};
