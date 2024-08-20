import { CaipAccountId, Hex, parseCaipAccountId } from '@metamask/utils';
import { Caip25CaveatValue } from '../caip25permissions';
import { KnownCaipNamespace, mergeScopes, parseScopeString } from '../scope';

// TODO(Jl): Move all the permission stuff into its own folder
export const getEthAccounts = (caip25CaveatValue: Caip25CaveatValue) => {
  const ethAccounts: string[] = [];
  const sessionScopes = mergeScopes(
    caip25CaveatValue.requiredScopes,
    caip25CaveatValue.optionalScopes,
  );

  Object.entries(sessionScopes).forEach(([_, { accounts }]) => {
    accounts?.forEach((account) => {
      const {
        address,
        chain: { namespace },
      } = parseCaipAccountId(account);

      if (namespace === KnownCaipNamespace.Eip155) {
        ethAccounts.push(address);
      }
    });
  });

  return Array.from(new Set(ethAccounts));
};

// This helper must be called with existing eip155 scopes
export const setEthAccounts = (
  caip25CaveatValue: Caip25CaveatValue,
  accounts: Hex[],
) => {
  Object.entries(caip25CaveatValue.requiredScopes).forEach(
    ([scopeString, scopeObject]) => {
      const { namespace } = parseScopeString(scopeString);

      if (namespace === KnownCaipNamespace.Eip155) {
        scopeObject.accounts = accounts.map(
          (account) => `${scopeString}:${account}` as CaipAccountId,
        );
      }
    },
  );

  Object.entries(caip25CaveatValue.optionalScopes).forEach(
    ([scopeString, scopeObject]) => {
      const { namespace } = parseScopeString(scopeString);

      if (namespace === KnownCaipNamespace.Eip155) {
        scopeObject.accounts = accounts.map(
          (account) => `${scopeString}:${account}` as CaipAccountId,
        );
      }
    },
  );

  // Should we cloning this rather than modifying it in-place?
  return caip25CaveatValue;
};
