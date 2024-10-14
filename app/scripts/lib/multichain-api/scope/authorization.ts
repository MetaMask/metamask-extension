import { ScopedProperties, ScopesObject } from '@metamask/multichain';
import { CaipChainId } from '@metamask/utils';
import { validateScopedPropertyEip3085 } from './validation';

// can't be moved over because of validateScopedPropertyEip3085
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
    const scope =
      requiredScopes[scopeString as CaipChainId] ||
      optionalScopes[scopeString as CaipChainId];
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
