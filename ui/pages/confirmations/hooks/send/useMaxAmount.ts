import { useCallback } from 'react';

import { Numeric } from '../../../../../shared/lib/Numeric';
import { Asset } from '../../types/send';
import { toTokenMinimalUnit } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useBalance } from './useBalance';
import { useNonEvmMaxAmount } from './useNonEvmMaxAmount';
import { useSendType } from './useSendType';

/**
 * Returns the Max amount for the selected asset.
 *
 * Max is the full balance. For native EVM sends, the gas fee is subtracted on
 * the confirmation by `useMaxValueRefresher`, using the gas estimated by
 * `TransactionController`.
 *
 * For non-EVM sends the network getter in `useNonEvmMaxAmount` computes the
 * maximum. Tron asks the Snap, which subtracts the network fees and, when the
 * recipient is unknown or inactive, the account activation reserve.
 */
export const useMaxAmount = () => {
  const { asset } = useSendContext();
  const { isNonEvmSendType } = useSendType();
  const { getNonEvmMaxAmount, isNonEvmMaxSupported } = useNonEvmMaxAmount();
  const { rawBalanceNumeric } = useBalance();

  const isMaxAmountSupported = !isNonEvmSendType || isNonEvmMaxSupported;

  const getMaxAmount = useCallback(async () => {
    if (isNonEvmMaxSupported) {
      const nonEvmMaxAmount = await getNonEvmMaxAmount();
      if (nonEvmMaxAmount) {
        return nonEvmMaxAmount;
      }
    }

    return getMaxAmountFn(asset, rawBalanceNumeric);
  }, [asset, getNonEvmMaxAmount, isNonEvmMaxSupported, rawBalanceNumeric]);

  return { getMaxAmount, isMaxAmountSupported };
};

function getMaxAmountFn(asset: Asset | undefined, rawBalanceNumeric: Numeric) {
  if (!asset || rawBalanceNumeric.isZero() || rawBalanceNumeric.isNegative()) {
    return '0';
  }

  return toTokenMinimalUnit(rawBalanceNumeric.toString(), asset.decimals, 10);
}
