import { PERPS_CONSTANTS } from '@metamask/perps-controller';
import { useEffect, useRef, useState } from 'react';

import { submitRequestToBackground } from '../../store/background-connection';

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

export const usePerpsLiquidationPrice = ({
  asset,
  direction,
  entryPrice,
  leverage,
  enabled,
}: UsePerpsLiquidationPriceParams): UsePerpsLiquidationPriceResult => {
  const [liquidationPrice, setLiquidationPrice] = useState<string>('0.00');
  const [isCalculating, setIsCalculating] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || entryPrice <= 0 || leverage <= 0 || !asset) {
      setLiquidationPrice('0.00');
      setIsCalculating(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let canceled = false;
    setIsCalculating(true);

    submitRequestToBackground<string>('perpsCalculateLiquidationPrice', [
      {
        asset,
        direction,
        entryPrice,
        leverage,
        marginType: 'isolated',
      },
    ])
      .then((price) => {
        if (canceled || requestIdRef.current !== requestId) {
          return;
        }
        setLiquidationPrice(price || '0.00');
      })
      .catch(() => {
        if (canceled || requestIdRef.current !== requestId) {
          return;
        }
        setLiquidationPrice(PERPS_CONSTANTS.FallbackPriceDisplay);
      })
      .finally(() => {
        if (canceled || requestIdRef.current !== requestId) {
          return;
        }
        setIsCalculating(false);
      });

    return () => {
      canceled = true;
    };
  }, [asset, direction, enabled, entryPrice, leverage]);

  return {
    isCalculating,
    liquidationPrice,
  };
};
