import { useDispatch } from 'react-redux';
import { useCallback } from 'react';

import { isResolvableName } from '../../../../helpers/utils/util';
import { findConfusablesInRecipient } from '../../utils/sendValidations';
import { lookupDomainName } from '../../../../ducks/domains';
import type { MetaMaskReduxDispatch } from '../../../../store/store';

type Resolution = {
  resolvedAddress?: string;
  protocol?: string;
};

/**
 * Known burn/zero addresses across multiple chains that should not be valid
 * resolution targets. If a name resolver returns any of these, it's likely an error.
 */
const MULTICHAIN_BURN_ZERO_ADDRESSES = [
  // EVM chains (Ethereum, Polygon, BSC, etc.)
  '0x0000000000000000000000000000000000000000',
  '0x0',
  '0x',
  // Solana
  '11111111111111111111111111111111', // System program (sometimes misused as burn)
  '1nc1nerator11111111111111111111111111111111', // Incinerator burn address
  // Tron
  'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb', // Tron zero address equivalent
];

/**
 * Checks if an address is a known burn or zero address across multiple chains.
 *
 * @param address - The address to check
 * @returns True if the address is a known burn/zero address
 */
function isBurnOrZeroAddress(address: string | undefined): boolean {
  if (!address) {
    return false;
  }
  const normalizedAddress = address.toLowerCase();
  return MULTICHAIN_BURN_ZERO_ADDRESSES.some(
    (burnAddress) => burnAddress.toLowerCase() === normalizedAddress,
  );
}

export const useNameValidation = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  const processResolutions = useCallback(
    (resolutions: Resolution[], domain: string) => {
      if (!resolutions || resolutions.length === 0) {
        return {
          error: 'nameResolutionFailedError',
        };
      }

      const resolvedAddress = resolutions[0]?.resolvedAddress;

      // Check if resolver returned a burn/zero address - likely an error
      if (isBurnOrZeroAddress(resolvedAddress)) {
        return {
          error: 'nameResolutionZeroAddressError',
        };
      }

      return {
        resolvedLookup: resolvedAddress,
        protocol: resolutions[0]?.protocol,
        ...findConfusablesInRecipient(domain),
      };
    },
    [],
  );

  const validateName = useCallback(
    async (chainId: string, to: string, signal?: AbortSignal) => {
      if (!isResolvableName(to)) {
        return {
          error: 'nameResolutionFailedError',
        };
      }

      // Return empty result for aborted operations - not an error, just cancelled
      if (signal?.aborted) {
        return {};
      }

      const resolutions = (await dispatch(
        lookupDomainName(to, chainId, signal),
      )) as Resolution[];

      // Check again after async operation - if aborted mid-execution, don't show error
      if (signal?.aborted) {
        return {};
      }

      return processResolutions(resolutions, to);
    },
    [dispatch, processResolutions],
  );

  return {
    validateName,
  };
};
