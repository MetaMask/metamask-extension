import { ERC1155 } from '@metamask/controller-utils';
import { useMemo } from 'react';

import { Numeric } from '../../../../../shared/modules/Numeric';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Asset } from '../../types/send';
import { fromTokenMinUnitsNumeric, isDecimal } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useBalance } from './useBalance';
import { assetChain } from 'viem/chains';

export const validateERC1155Balance = (
  asset: Asset,
  value: string | undefined,
  t: ReturnType<typeof useI18nContext>,
) => {
  if (asset?.balance && value) {
    if (parseInt(value, 10) > parseInt(asset.balance.toString(), 10)) {
      return t('insufficientFundsSend');
    }
  }
  return undefined;
};

export const validateTokenBalance = (
  amount: string,
  rawBalanceNumeric: Numeric,
  t: ReturnType<typeof useI18nContext>,
  decimals?: number,
) => {
  const amountInputNumeric = fromTokenMinUnitsNumeric(amount, 10, decimals);
  if (rawBalanceNumeric.lessThan(amountInputNumeric)) {
    return t('insufficientFundsSend');
  }
  return undefined;
};

export const useAmountValidation = () => {
  const t = useI18nContext();
  const { asset, value } = useSendContext();
  const { rawBalanceNumeric } = useBalance();

  const amountError = useMemo(() => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (!isDecimal(value) || Number(value) < 0) {
      return t('invalidValue');
    }
    if (asset?.standard === ERC1155) {
      return validateERC1155Balance(asset, value, t);
    }
    return validateTokenBalance(value, rawBalanceNumeric, t, asset?.decimals);
  }, [asset, rawBalanceNumeric, t, value]);

  return { amountError };
};
