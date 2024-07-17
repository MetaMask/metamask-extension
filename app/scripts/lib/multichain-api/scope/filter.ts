import { Hex } from '@metamask/utils';
import { ScopesObject } from './scope';
import { assertScopeSupported } from './assert';

export const filterScopesSupported = (
  scopes: ScopesObject,
  {
    existsNetworkClientForChainId,
  }: {
    existsNetworkClientForChainId: (chainId: Hex) => boolean;
  },
) => {
  const supportedScopes: ScopesObject = {};

  for (const [scopeString, scopeObject] of Object.entries(scopes)) {
    try {
      assertScopeSupported(scopeString, scopeObject, {
        existsNetworkClientForChainId,
      });
      supportedScopes[scopeString] = scopeObject;
    } catch (err) {
      // noop
    }
  }

  return supportedScopes;
};
