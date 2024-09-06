import { CaipChainId, Hex } from '@metamask/utils';
import { ScopesObject } from './scope';
import { assertScopeSupported } from './assert';

export const bucketScopesBySupport = (
  scopes: ScopesObject,
  {
    isChainIdSupported,
  }: {
    isChainIdSupported: (chainId: Hex) => boolean;
  },
) => {
  const supportedScopes: ScopesObject = {};
  const unsupportedScopes: ScopesObject = {};

  for (const [scopeString, scopeObject] of Object.entries(scopes)) {
    try {
      assertScopeSupported(scopeString, scopeObject, {
        isChainIdSupported,
      });
      supportedScopes[scopeString as CaipChainId] = scopeObject;
    } catch (err) {
      unsupportedScopes[scopeString as CaipChainId] = scopeObject;
    }
  }

  return { supportedScopes, unsupportedScopes };
};

export const filterScopesSupported = (
  scopes: ScopesObject,
  {
    isChainIdSupported,
  }: {
    isChainIdSupported: (chainId: Hex) => boolean;
  },
) => {
  const { supportedScopes } = bucketScopesBySupport(scopes, {
    isChainIdSupported,
  });

  return supportedScopes;
};
