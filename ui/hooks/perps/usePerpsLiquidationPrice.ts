import { PERPS_CONSTANTS } from '@metamask/perps-controller';
import { useEffect, useRef } from 'react';

import { submitRequestToBackground } from '../../store/background-connection';
import { useAsyncResult } from '../useAsync';

type UsePerpsLiquidationPriceParams = {
  asset: string;
  direction: 'long' | 'short';
  entryPrice: number;
  leverage: number;
  enabled: boolean;
};

type UsePerpsLiquidationPriceResult = {
  isCalculating: boolean;
  liquidationPrice: string;
};

const DEFAULT_LIQUIDATION_PRICE = '0.00';

export const usePerpsLiquidationPrice = ({
  asset,
  direction,
  entryPrice,
  leverage,
  enabled,
}: UsePerpsLiquidationPriceParams): UsePerpsLiquidationPriceResult => {
  const hasValidInputs =
    enabled && entryPrice > 0 && leverage > 0 && Boolean(asset);
  const lastResolvedPriceRef = useRef(DEFAULT_LIQUIDATION_PRICE);
  const result = useAsyncResult(async () => {
    if (!hasValidInputs) {
      return DEFAULT_LIQUIDATION_PRICE;
    }

    try {
      const price = await submitRequestToBackground<string>(
        'perpsCalculateLiquidationPrice',
        [
          {
            asset,
            direction,
            entryPrice,
            leverage,
            marginType: 'isolated',
          },
        ],
      );

      return price || DEFAULT_LIQUIDATION_PRICE;
    } catch {
      return PERPS_CONSTANTS.FallbackPriceDisplay;
    }
  }, [asset, direction, entryPrice, leverage, hasValidInputs]);

  useEffect(() => {
    if (!hasValidInputs) {
      lastResolvedPriceRef.current = DEFAULT_LIQUIDATION_PRICE;
      return;
    }

    if (result.status === 'success') {
      lastResolvedPriceRef.current = result.value;
    }
  }, [hasValidInputs, result]);

  let liquidationPrice = DEFAULT_LIQUIDATION_PRICE;
  if (hasValidInputs) {
    liquidationPrice =
      result.status === 'success' ? result.value : lastResolvedPriceRef.current;
  }

  return {
    isCalculating: hasValidInputs && result.pending,
    liquidationPrice,
  };
};
