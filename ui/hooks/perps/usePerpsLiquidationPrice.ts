import { PERPS_CONSTANTS } from '@metamask/perps-controller';
import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { submitRequestToBackground } from '../../store/background-connection';

type UsePerpsLiquidationPriceParams = {
  asset: string;
  direction: 'long' | 'short';
  entryPrice: number;
  leverage: number;
  enabled: boolean;
};

type UsePerpsLiquidationPriceOptions = {
  debounceMs?: number;
};

type UsePerpsLiquidationPriceResult = {
  isCalculating: boolean;
  liquidationPrice: string;
};

const DEFAULT_LIQUIDATION_PRICE = '0.00';
const DEFAULT_DEBOUNCE_MS = 300;

export const usePerpsLiquidationPrice = (
  {
    asset,
    direction,
    entryPrice,
    leverage,
    enabled,
  }: UsePerpsLiquidationPriceParams,
  options?: UsePerpsLiquidationPriceOptions,
): UsePerpsLiquidationPriceResult => {
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const hasValidInputs =
    enabled && entryPrice > 0 && leverage > 0 && Boolean(asset);

  const [liquidationPrice, setLiquidationPrice] = useState<string>(
    DEFAULT_LIQUIDATION_PRICE,
  );
  const [isCalculating, setIsCalculating] = useState(false);

  const calculatePrice = useMemo(
    () =>
      debounce(async () => {
        if (!hasValidInputs) {
          setIsCalculating(false);
          return;
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
          setLiquidationPrice(price || DEFAULT_LIQUIDATION_PRICE);
        } catch {
          setLiquidationPrice(PERPS_CONSTANTS.FallbackPriceDisplay);
        } finally {
          setIsCalculating(false);
        }
      }, debounceMs),
    [asset, direction, entryPrice, leverage, hasValidInputs, debounceMs],
  );

  useEffect(() => {
    if (hasValidInputs) {
      setIsCalculating(true);
    }
    calculatePrice();
    return () => {
      calculatePrice.cancel();
    };
  }, [calculatePrice, hasValidInputs]);

  return {
    isCalculating: hasValidInputs && isCalculating,
    liquidationPrice: hasValidInputs
      ? liquidationPrice
      : DEFAULT_LIQUIDATION_PRICE,
  };
};
