import { ERC1155 } from '@metamask/controller-utils';
import { useCallback } from 'react';

import { useAsyncResult } from '../../../../hooks/useAsync';
import { useSendContext } from '../../context/send';
import { useEvmAmountValidation } from './evm/useEvmAmountValidation';
import { useNonEvmAmountValidation } from './non-evm/useNonEvmAmountValidation';
import { useSendType } from './useSendType';

export const useAmountValidation = () => {
  const { asset } = useSendContext();
  const { isEvmSendType } = useSendType();
  const { validateEvmAmount } = useEvmAmountValidation();
  const { validateNonEvmAmount } = useNonEvmAmountValidation();

  const validateAmount = useCallback(async (): Promise<string | undefined> => {
    if (asset?.standard === ERC1155) {
      // todo: add logic to check units for ERC1155 tokens
      return undefined;
    }
    return isEvmSendType ? validateEvmAmount() : await validateNonEvmAmount();
  }, [asset?.standard, isEvmSendType, validateEvmAmount, validateNonEvmAmount]);

  const { value: amountError } = useAsyncResult(validateAmount, [
    validateAmount,
  ]);

  return { amountError };
};
