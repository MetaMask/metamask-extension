import { ChainId } from '../../types/bridge';
import { add0x } from '@metamask/utils';
import { decimalToHex } from '../conversion.utils';
import { MultichainNetworks } from '../../constants/multichain/networks';

/**
 * Converts the given chainId from the bridge-api to the format used by the rest of the app.
 *
 * @param {string} chainId - The chain ID to format.
 * @returns {string} - The formatted chain ID.
 */
export const formatChainIdFromApi = (chainId: string) => {
  switch (chainId) {
    case ChainId.SOLANA.toString():
      return MultichainNetworks.SOLANA;
    default:
      return add0x(decimalToHex(chainId));
  }
};
