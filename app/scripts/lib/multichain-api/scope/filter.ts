import { Hex } from '@metamask/utils';
import { ScopesObject } from './scope';
import { assertScopeSupported } from './assert';

export const bucketScopesSupported = (
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
      supportedScopes[scopeString] = scopeObject;
    } catch (err) {
      unsupportedScopes[scopeString] = scopeObject;
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
  const { supportedScopes } = bucketScopesSupported(scopes, {
    isChainIdSupported,
  });

  return supportedScopes;
};
