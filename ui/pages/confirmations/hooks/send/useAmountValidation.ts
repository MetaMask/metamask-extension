import { ERC1155 } from '@metamask/controller-utils';
import { useCallback } from 'react';

import { Asset } from '../../types/send';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { isDecimal } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useEvmAmountValidation } from './evm/useEvmAmountValidation';
import { useNonEvmAmountValidation } from './non-evm/useNonEvmAmountValidation';
import { useSendType } from './useSendType';

export const validateERC1155Balance = (
  asset: Asset,
  value: string | undefined,
  t: ReturnType<typeof useI18nContext>,
) => {
  if (asset?.balance && value) {
    if (parseInt(value) > parseInt(asset.balance.toString())) {
      return t('insufficientFunds');
    }
  }
  return undefined;
};

export const useAmountValidation = () => {
  const t = useI18nContext();
  const { asset, value } = useSendContext();
  const { isEvmSendType } = useSendType();
  const { validateEvmAmount } = useEvmAmountValidation();
  const { validateNonEvmAmount } = useNonEvmAmountValidation();

  const validateAmount = useCallback(async (): Promise<string | undefined> => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (!isDecimal(value) || Number(value) < 0) {
      return t('invalidValue');
    }
    if (asset?.standard === ERC1155) {
      return validateERC1155Balance(asset, value, t);
    }
    return isEvmSendType ? validateEvmAmount() : await validateNonEvmAmount();
  }, [
    asset?.standard,
    isEvmSendType,
    validateEvmAmount,
    validateNonEvmAmount,
    value,
  ]);

  const { value: amountError } = useAsyncResult(validateAmount, [
    validateAmount,
  ]);

  return { amountError };
};
