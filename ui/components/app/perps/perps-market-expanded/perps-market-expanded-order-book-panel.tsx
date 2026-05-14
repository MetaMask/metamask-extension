import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsLiveOrderBook } from '../../../../hooks/perps/stream';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { PerpsOrderBook, type OrderBookPriceClick } from '../perps-order-book';

export type PerpsMarketExpandedOrderBookPanelProps = {
  symbol: string;
  onPriceClick: (priceClick: OrderBookPriceClick) => void;
  onMidPriceChange?: (midPrice: number | undefined) => void;
};

export const PerpsMarketExpandedOrderBookPanel: React.FC<
  PerpsMarketExpandedOrderBookPanelProps
> = ({ symbol, onPriceClick, onMidPriceChange }) => {
  const t = useI18nContext();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const { orderBook, isInitialLoading: isLoading } = usePerpsLiveOrderBook({
    symbol,
    levels: 50,
  });

  useEffect(() => {
    if (!symbol || !selectedAddress) {
      return undefined;
    }

    submitRequestToBackground('perpsActivateOrderBookStream', [
      { symbol },
    ]).catch(() => undefined);

    return () => {
      submitRequestToBackground('perpsDeactivateOrderBookStream', []).catch(
        () => undefined,
      );
    };
  }, [selectedAddress, symbol]);

  useEffect(() => {
    const midPrice = orderBook?.midPrice
      ? Number.parseFloat(orderBook.midPrice)
      : undefined;
    onMidPriceChange?.(
      midPrice !== undefined && Number.isFinite(midPrice)
        ? midPrice
        : undefined,
    );
  }, [onMidPriceChange, orderBook?.midPrice]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="min-h-0 overflow-hidden border-r border-border-muted max-[980px]:min-h-[420px]"
      data-testid="perps-expanded-order-book-panel"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        className="shrink-0 px-3 py-2"
      >
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {t('perpsOrders')}
        </Text>
      </Box>
      <Box className="min-h-0 flex-1 overflow-hidden">
        <PerpsOrderBook
          orderBook={orderBook}
          isLoading={isLoading}
          onPriceClick={onPriceClick}
        />
      </Box>
    </Box>
  );
};
