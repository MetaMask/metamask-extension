import { CaipChainId, Hex } from '@metamask/utils';
import { InternalScopesObject } from './scope';
import { assertScopeSupported } from './assert';

export const bucketScopesBySupport = (
  scopes: InternalScopesObject,
  {
    isChainIdSupported,
  }: {
    isChainIdSupported: (chainId: Hex) => boolean;
  },
) => {
  const supportedScopes: InternalScopesObject = {};
  const unsupportedScopes: InternalScopesObject = {};

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
  scopes: InternalScopesObject,
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
