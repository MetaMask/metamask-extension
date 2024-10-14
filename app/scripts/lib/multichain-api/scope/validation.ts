import { parseScopeString } from '@metamask/multichain';
import { KnownCaipNamespace } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { validateAddEthereumChainParams } from '../../rpc-method-middleware/handlers/ethereum-chain-utils';

// can't be moved over because of validateAddEthereumChainParams
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
