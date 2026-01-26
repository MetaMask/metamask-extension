import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  toCaipAccountId,
  parseCaipChainId,
  type CaipAccountId,
  isValidHexAddress,
  Hex,
} from '@metamask/utils';
import log from 'loglevel';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';

/**
 * Formats an address to CAIP-10 account ID
 *
 * @param address - The address to format
 * @param chainId - The chain ID to use for the CAIP-10 account ID
 * @returns The CAIP-10 account ID or null if formatting fails
 */
export const formatAccountToCaipAccountId = (
  address: string,
  chainId: string,
): CaipAccountId | null => {
  try {
    const caipChainId = formatChainIdToCaip(chainId);
    const { namespace, reference } = parseCaipChainId(caipChainId);
    const coercedAddress = isValidHexAddress(address as Hex)
      ? toChecksumHexAddress(address)
      : address;
    return toCaipAccountId(namespace, reference, coercedAddress);
  } catch (error) {
    log.error('[rewards-utils] Error formatting account to CAIP-10:', error);
    return null;
  }
};
