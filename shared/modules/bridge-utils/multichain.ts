import { add0x, type CaipChainId, type Hex } from '@metamask/utils';
import { getAddress as ethersGetAddress } from 'ethers/lib/utils';
import { type QuoteRequest, ChainId } from '../../types/bridge';
import { decimalToHex, hexToDecimal } from '../conversion.utils';
import { MultichainNetworks } from '@metamask/assets-controllers';

export const isMultichainRequest = (request: QuoteRequest) => {
  return [request.srcChainId, request.destChainId].includes(ChainId.SOLANA);
};

export const getAddress = (address: string) => {
  try {
    return ethersGetAddress(address);
  } catch {
    return address;
  }
};

export const formatChainIdToApi = (chainId?: CaipChainId | Hex) => {
  switch (chainId) {
    case undefined:
      return undefined;
    case MultichainNetworks.Solana:
      return ChainId.SOLANA;
    default:
      return Number(hexToDecimal(chainId));
  }
};

export const formatChainIdFromApi = (chainId: string) => {
  switch (chainId) {
    case ChainId.SOLANA.toString():
      return MultichainNetworks.Solana;
    default:
      return add0x(decimalToHex(chainId));
  }
};
