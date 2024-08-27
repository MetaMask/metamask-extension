import { Hex } from '@metamask/utils';
import { validateScopedPropertyEip3085, validateScopes } from './validation';
import { ExternalScopesObject, InternalScopesObject, ScopedProperties, ScopesObject } from './scope';
import { flattenMergeScopes } from './transform';
import { bucketScopesBySupport } from './filter';

export type Caip25Authorization =
  | {
      requiredScopes: ScopesObject;
      optionalScopes?: ScopesObject;
      sessionProperties?: Record<string, unknown>;
    }
  | ({
      requiredScopes?: ScopesObject;
      optionalScopes: ScopesObject;
    } & {
      sessionProperties?: Record<string, unknown>;
    });

export const validateAndFlattenScopes = (
  requiredScopes: ExternalScopesObject,
  optionalScopes: ExternalScopesObject,
): {
  flattenedRequiredScopes: InternalScopesObject
  flattenedOptionalScopes: InternalScopesObject
} => {
  const { validRequiredScopes, validOptionalScopes } = validateScopes(
    requiredScopes,
    optionalScopes,
  );

  // TODO: determine is merging is a valid strategy
  const flattenedRequiredScopes = flattenMergeScopes(validRequiredScopes);
  const flattenedOptionalScopes = flattenMergeScopes(validOptionalScopes);

  return {
    flattenedRequiredScopes,
    flattenedOptionalScopes,
  };
};

export const bucketScopes = (
  scopes: ScopesObject,
  {
    isChainIdSupported,
    isChainIdSupportable,
  }: {
    isChainIdSupported: (chainId: Hex) => boolean;
    isChainIdSupportable: (chainId: Hex) => boolean;
  },
): {
  supportedScopes: ScopesObject;
  supportableScopes: ScopesObject;
  unsupportableScopes: ScopesObject;
} => {
  const { supportedScopes, unsupportedScopes: maybeSupportableScopes } =
    bucketScopesBySupport(scopes, {
      isChainIdSupported,
    });

  const {
    supportedScopes: supportableScopes,
    unsupportedScopes: unsupportableScopes,
  } = bucketScopesBySupport(maybeSupportableScopes, {
    isChainIdSupported: isChainIdSupportable,
  });

  return { supportedScopes, supportableScopes, unsupportableScopes };
};

export const processScopedProperties = (
  requiredScopes: ScopesObject,
  optionalScopes: ScopesObject,
  scopedProperties?: ScopedProperties,
): ScopedProperties => {
  if (!scopedProperties) {
    return {};
  }
  const validScopedProperties: ScopedProperties = {};

  for (const [scopeString, scopedProperty] of Object.entries(
    scopedProperties,
  )) {
    const scope = requiredScopes[scopeString] || optionalScopes[scopeString];
    if (!scope) {
      continue;
    }
    validScopedProperties[scopeString] = {};

    if (scopedProperty.eip3085) {
      try {
        validateScopedPropertyEip3085(scopeString, scopedProperty.eip3085);
        validScopedProperties[scopeString].eip3085 = scopedProperty.eip3085;
      } catch (err) {
        // noop
      }
    }
  }

  return validScopedProperties;
};
