import React, { useCallback, useState } from 'react';
import type { OrderDirection, OrderFormState } from '../order-entry';
import type { OrderType, Position } from '../types';
import type { OrderBookPriceClick } from '../perps-order-book';
import { usePerpsLivePrices } from '../../../../hooks/perps/stream';
import { getPositionDirection } from '../utils';
import { PerpsMarketExpandedOrderBookPanel } from './perps-market-expanded-order-book-panel';
import { PerpsMarketExpandedOrderTicket } from './perps-market-expanded-order-ticket';
import {
  getExpandedOraclePrice,
  toExpandedExistingPositionData,
} from './utils';

export type PerpsMarketExpandedTradeSectionProps = {
  symbol: string;
  currentPrice: number;
  maxLeverage: number;
  availableBalance: number;
  initialLeverage: number;
  isPending: boolean;
  isEligible: boolean;
  activePosition?: Position;
  onGeoBlocked: () => void;
  onSubmit: (formState: OrderFormState) => void;
  onPositionReverse: (position: Position) => void;
  onPositionClose: (position: Position) => void;
};

export const PerpsMarketExpandedTradeSection: React.FC<
  PerpsMarketExpandedTradeSectionProps
> = ({
  symbol,
  currentPrice,
  maxLeverage,
  availableBalance,
  initialLeverage,
  isPending,
  isEligible,
  activePosition,
  onGeoBlocked,
  onSubmit,
  onPositionReverse,
  onPositionClose,
}) => {
  const [selectedDirection, setSelectedDirection] =
    useState<OrderDirection>('long');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [midPrice, setMidPrice] = useState<number | undefined>();
  const [prefillLimitPrice, setPrefillLimitPrice] = useState<{
    price: string;
    id: number;
  }>();
  const { prices } = usePerpsLivePrices({
    symbols: [symbol],
    activateStream: false,
  });
  const hasActivePosition = Boolean(activePosition);
  const direction = activePosition
    ? getPositionDirection(activePosition.size)
    : selectedDirection;
  const existingPosition = activePosition
    ? toExpandedExistingPositionData(activePosition)
    : undefined;

  const handleOrderBookPriceClick = useCallback(
    ({ price }: OrderBookPriceClick) => {
      if (!isEligible) {
        onGeoBlocked();
        return;
      }

      setOrderType('limit');
      setPrefillLimitPrice((previous) => ({
        price,
        id: (previous?.id ?? 0) + 1,
      }));
    },
    [isEligible, onGeoBlocked],
  );

  const handleReversePosition = useCallback(() => {
    if (!activePosition) {
      return;
    }
    if (!isEligible) {
      onGeoBlocked();
      return;
    }
    onPositionReverse(activePosition);
  }, [activePosition, isEligible, onGeoBlocked, onPositionReverse]);

  const handleClosePosition = useCallback(() => {
    if (!activePosition) {
      return;
    }
    if (!isEligible) {
      onGeoBlocked();
      return;
    }
    onPositionClose(activePosition);
  }, [activePosition, isEligible, onGeoBlocked, onPositionClose]);

  return (
    <>
      <PerpsMarketExpandedOrderBookPanel
        symbol={symbol}
        onPriceClick={handleOrderBookPriceClick}
        onMidPriceChange={setMidPrice}
      />

      <PerpsMarketExpandedOrderTicket
        asset={symbol}
        currentPrice={currentPrice}
        markPrice={getExpandedOraclePrice(prices[symbol]?.markPrice)}
        maxLeverage={maxLeverage}
        availableBalance={availableBalance}
        direction={direction}
        orderType={orderType}
        midPrice={midPrice}
        onOrderTypeChange={setOrderType}
        initialLeverage={initialLeverage}
        isPending={isPending}
        existingPosition={existingPosition}
        onDirectionChange={setSelectedDirection}
        onSubmit={onSubmit}
        prefillLimitPrice={prefillLimitPrice}
        onReversePosition={
          hasActivePosition ? handleReversePosition : undefined
        }
        onClosePosition={hasActivePosition ? handleClosePosition : undefined}
      />
    </>
  );
};
