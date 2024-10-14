import { CaipChainId, Hex, KnownCaipNamespace } from '@metamask/utils';
import {
  NetworkController,
  RpcEndpointType,
} from '@metamask/network-controller';
import {
  parseScopeString,
  ScopedProperties,
  ScopesObject,
} from '@metamask/multichain';
import { toHex } from '@metamask/controller-utils';
import { validateAddEthereumChainParams } from '../../rpc-method-middleware/handlers/ethereum-chain-utils';

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

export const validateAndAddEip3085 = async ({
  eip3085Params,
  addNetwork,
  findNetworkClientIdByChainId,
}: {
  eip3085Params: unknown;
  addNetwork: NetworkController['addNetwork'];
  findNetworkClientIdByChainId: NetworkController['findNetworkClientIdByChainId'];
}): Promise<undefined | Hex> => {
  const validParams = validateAddEthereumChainParams(eip3085Params);

  const {
    chainId,
    chainName,
    firstValidBlockExplorerUrl,
    firstValidRPCUrl,
    ticker,
  } = validParams;

  try {
    findNetworkClientIdByChainId(chainId as Hex);
    return undefined;
  } catch (err) {
    // noop
  }

  const networkConfiguration = await addNetwork({
    blockExplorerUrls: firstValidBlockExplorerUrl
      ? [firstValidBlockExplorerUrl]
      : [],
    defaultBlockExplorerUrlIndex: firstValidBlockExplorerUrl ? 0 : undefined,
    chainId: chainId as Hex,
    defaultRpcEndpointIndex: 0,
    name: chainName,
    nativeCurrency: ticker,
    rpcEndpoints: [
      {
        url: firstValidRPCUrl,
        name: chainName,
        type: RpcEndpointType.Custom,
      },
    ],
  });

  return networkConfiguration.chainId;
};

export const processScopedProperties = (
  requiredScopes: ScopesObject,
  optionalScopes: ScopesObject,
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
    validScopedProperties[scopeString] = {};

    if (scopedProperty.eip3085) {
      try {
        hooks.validateScopedPropertyEip3085(
          scopeString,
          scopedProperty.eip3085,
        );
        validScopedProperties[scopeString].eip3085 = scopedProperty.eip3085;
      } catch (err) {
        // noop
      }
    }
  }

  return validScopedProperties;
};
