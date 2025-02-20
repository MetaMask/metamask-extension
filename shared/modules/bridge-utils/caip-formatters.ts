import {
  type Hex,
  type CaipChainId,
  isCaipChainId,
  isStrictHexString,
  toCaipChainId,
  KnownCaipNamespace,
  hexToBigInt,
  parseCaipChainId,
  isCaipReference,
} from '@metamask/utils';
import { zeroAddress, toChecksumAddress } from 'ethereumjs-util';
import { MultichainNetworks } from '../../constants/multichain/networks';
import { ChainId } from '../../types/bridge';
import { decimalToPrefixedHex, hexToDecimal } from '../conversion.utils';
import { MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 } from '../../constants/multichain/assets';
import { isValidNumber } from './validators';

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

export const formatChainIdToHex = (chainId?: number | Hex | CaipChainId) => {
  if (isStrictHexString(chainId)) {
    return chainId;
  }
  if (isCaipChainId(chainId)) {
    const { reference } = parseCaipChainId(chainId);
    if (isCaipReference(reference) && isValidNumber(reference)) {
      return decimalToPrefixedHex(reference);
    }
  }
  return undefined;
};

export const formatAddressToString = (address?: string) => {
  if (!address) {
    return undefined;
  }
  if (isStrictHexString(address)) {
    return toChecksumAddress(address);
  }
  if (
    Object.values(MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19).some((assetId) =>
      assetId.includes(address),
    )
  ) {
    return zeroAddress();
  }
  return address.split(':').at(-1);
};
