import { CaipChainId, KnownCaipNamespace } from '@metamask/utils';
import {
  parseScopeString,
  ScopedProperties,
  NormalizedScopesObject,
} from '@metamask/multichain';
import { toHex } from '@metamask/controller-utils';
import { validateAddEthereumChainParams } from '../ethereum-chain-utils';

export const validateScopedPropertyEip3085 = (
  scopeString: string,
  eip3085Params: unknown,
) => {
  if (!eip3085Params) {
    throw new Error('eip3085 params are missing');
  }

  const { namespace, reference } = parseScopeString(scopeString);

  if (!namespace || !reference) {
    throw new Error('scopeString is malformed');
  }

  if (namespace !== KnownCaipNamespace.Eip155) {
    throw new Error('namespace is not eip155');
  }

  const validParams = validateAddEthereumChainParams(eip3085Params);

  if (validParams.chainId !== toHex(reference)) {
    throw new Error('eip3085 chainId does not match reference');
  }

  return validParams;
};

export const processScopedProperties = (
  requiredScopes: NormalizedScopesObject,
  optionalScopes: NormalizedScopesObject,
  scopedProperties?: ScopedProperties,
  hooks = { validateScopedPropertyEip3085 },
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
    validScopedProperties[scopeString as CaipChainId] = {};

    if (scopedProperty.eip3085) {
      try {
        hooks.validateScopedPropertyEip3085(
          scopeString,
          scopedProperty.eip3085,
        );
        validScopedProperties[scopeString as CaipChainId].eip3085 =
          scopedProperty.eip3085;
      } catch (err) {
        // noop
      }
    }
  }

  return validScopedProperties;
};
