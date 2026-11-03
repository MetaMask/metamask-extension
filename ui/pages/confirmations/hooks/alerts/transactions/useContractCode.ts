import { Hex } from '@metamask/utils';
import { addHexPrefix, padToEven } from 'ethereumjs-util';
import { useCallback } from 'react';

import { getCode } from '../../../../../store/actions';
import { useAsyncResult } from '../../../../../hooks/useAsync';

/**
 * Hook to retrieve and analyze contract code for a given address.
 *
 * This hook fetches the bytecode at the specified address and determines whether
 * it represents a contract address or an externally owned account (EOA).
 *
 * @param address - The hex-encoded Ethereum address to check for contract code
 * @param networkClientId - The network client identifier to use for the code lookup
 * @returns An async result object containing:
 * - `contractCode`: The processed contract bytecode as a hex string, or null if unavailable
 * - `isContractAddress`: Boolean indicating if the address contains contract code
 */
export function useContractCode(address: Hex, networkClientId: string) {
  const getCodeAsync = useCallback(async () => {
    if (!networkClientId || !address) {
      return {
        contractCode: null,
        isContractAddress: null,
      };
    }

    let contractCode: string | null = null;
    try {
      const result = await getCode(address, networkClientId);
      contractCode = addHexPrefix(padToEven(result.slice(2)));
    } catch (err) {
      contractCode = null;
    }
    const isContractAddress = contractCode
      ? contractCode !== '0x' && contractCode !== '0x0'
      : false;
    return { contractCode, isContractAddress };
  }, [address, networkClientId]);

  return useAsyncResult(getCodeAsync, [address, networkClientId]);
}
