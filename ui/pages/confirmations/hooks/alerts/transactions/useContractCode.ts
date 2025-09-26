import { Hex } from '@metamask/utils';
import { addHexPrefix, padToEven } from 'ethereumjs-util';
import { useCallback } from 'react';

import { getCode } from '../../../../../store/actions';
import { useAsyncResult } from '../../../../../hooks/useAsync';

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
