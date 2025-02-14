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
import { ChainId } from '../../types/bridge';
import { hexToDecimal } from '../conversion.utils';
import { toChecksumAddress } from 'ethereumjs-util';

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
export const formatChainIdToDec = (chainId: number | Hex | CaipChainId) => {
  if (isStrictHexString(chainId)) {
    return Number(hexToDecimal(chainId));
  }
  if (chainId === MultichainNetworks.SOLANA) {
    return ChainId.SOLANA;
  }
  if (isCaipChainId(chainId)) {
    return Number(chainId.split(':').at(-1));
  }

  return chainId;
};
export const formatAddressToString = (address?: string) => {
  if (!address) {
    return undefined;
  }
  if (isStrictHexString(address)) {
    return toChecksumAddress(address);
  }
  return address.split(':').at(-1);
};
