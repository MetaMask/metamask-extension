import { add0x, type CaipChainId, type Hex } from '@metamask/utils';
import { getAddress as ethersGetAddress } from 'ethers/lib/utils';
import { ChainId } from '../../types/bridge';
import { decimalToHex, hexToDecimal } from '../conversion.utils';
import { MultichainNetworks } from '../../constants/multichain/networks';
import { type AllowedBridgeChainIds } from '../../constants/bridge';

/**
 * Converts the given chainId from the bridge-api to the format used by the rest of the app.
 *
 * @param chainId - The chain ID to format.
 * @returns The formatted chain ID.
 */
export const formatChainIdFromDecimal = (chainId: ChainId | string) => {
  switch (chainId) {
    case ChainId.SOLANA:
    case ChainId.SOLANA.toString():
      return MultichainNetworks.SOLANA;
    default:
      return add0x(decimalToHex(chainId)) as AllowedBridgeChainIds;
  }
};

/**
 * Converts the given hex or caipchainId to the decimal format used by the bridge-api.
 *
 * @param chainId - The chain ID to format.
 * @returns The formatted chain ID.
 */
export const formatChainIdToDecimal = (
  chainId?: AllowedBridgeChainIds | Hex | CaipChainId,
) => {
  switch (chainId) {
    case undefined:
      return undefined;
    case MultichainNetworks.SOLANA:
      return ChainId.SOLANA;
    default:
      return Number(hexToDecimal(chainId));
  }
};

/**
 * Returns the address in the format used by the rest of the app.
 *
 * @param address - The address to format.
 * @returns The formatted address.
 */
export const getAddress = (address: string) => {
  try {
    return ethersGetAddress(address);
  } catch {
    return address;
  }
};
