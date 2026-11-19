import { useCallback } from 'react';

import { Numeric } from '../../../../../shared/lib/Numeric';
import { Asset } from '../../types/send';
import { toTokenMinimalUnit } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useBalance } from './useBalance';

/**
 * Returns the Max amount for the selected asset.
 *
 * Max is the full balance. For native EVM sends, the gas fee is subtracted on
 * the confirmation by `useMaxValueRefresher`, using the gas estimated by
 * `TransactionController`.
 */
export const useMaxAmount = () => {
  const { asset } = useSendContext();
  const { rawBalanceNumeric } = useBalance();

  const getMaxAmount = useCallback(
    () => getMaxAmountFn(asset, rawBalanceNumeric),
    [asset, rawBalanceNumeric],
  );

  return { getMaxAmount };
};

function getMaxAmountFn(asset: Asset | undefined, rawBalanceNumeric: Numeric) {
  if (!asset || rawBalanceNumeric.isZero() || rawBalanceNumeric.isNegative()) {
    return '0';
  }

  return toTokenMinimalUnit(rawBalanceNumeric.toString(), asset.decimals, 10);
}
