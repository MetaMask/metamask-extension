import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { CaipChainId, Hex } from '@metamask/utils';
import {
  applyDisplaySign,
  getDisplaySignPrefix,
} from '../../shared/lib/activity/fiat';
import type { TokenAmount } from '../../shared/lib/activity/types';
import { getCurrentCurrency } from '../ducks/metamask/metamask';
import { useConvertToFiat } from './useConvertToFiat';
import { useFormatters } from './useFormatters';

export function useFormatAsFiat(chainId: Hex | CaipChainId) {
  const convertToFiat = useConvertToFiat(chainId);
  const currency = useSelector(getCurrentCurrency);
  const { formatCurrencyWithMinThreshold } = useFormatters();

  return useCallback(
    (
      token: TokenAmount | undefined,
      { showPlus = true }: { showPlus?: boolean } = {},
    ) => {
      if (!token) {
        return undefined;
      }

      const value = convertToFiat(token);
      if (value === undefined) {
        return undefined;
      }

      const { direction } = token;
      const signedValue = direction === 'out' ? -value : value;

      return applyDisplaySign(
        formatCurrencyWithMinThreshold(signedValue, currency),
        getDisplaySignPrefix(direction, { showPlus }),
      );
    },
    [convertToFiat, formatCurrencyWithMinThreshold, currency],
  );
}
