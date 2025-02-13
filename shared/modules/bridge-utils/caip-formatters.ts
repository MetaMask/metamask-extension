import {
  type Hex,
  type CaipChainId,
  isCaipChainId,
  isStrictHexString,
  toCaipChainId,
  KnownCaipNamespace,
  hexToBigInt,
} from '@metamask/utils';
import { MultichainNetworks } from '../../constants/multichain/networks';

// Converts a chainId to a CaipChainId
export const normalizeChainId = (
  chainId: Hex | number | CaipChainId | string,
): CaipChainId => {
  if (isCaipChainId(chainId)) {
    return chainId;
  } else if (isStrictHexString(chainId)) {
    return toCaipChainId(
      KnownCaipNamespace.Eip155,
      hexToBigInt(chainId).toString(10),
    );
  }
  const chainIdString = chainId.toString();
  if (chainIdString === '1151111081099710') {
    return MultichainNetworks.SOLANA;
  }
  return toCaipChainId(KnownCaipNamespace.Eip155, chainIdString);
};
