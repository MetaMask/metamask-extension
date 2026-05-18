import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  DirectionTabs,
  OrderEntry,
  type ExistingPositionData,
  type OrderDirection,
  type OrderFormState,
} from '../order-entry';
import type { OrderType } from '../types';

export type PerpsMarketExpandedOrderTicketProps = {
  asset: string;
  currentPrice: number;
  markPrice?: number;
  maxLeverage: number;
  availableBalance: number;
  direction: OrderDirection;
  orderType: OrderType;
  midPrice?: number;
  initialLeverage: number;
  isPending: boolean;
  existingPosition?: ExistingPositionData;
  prefillLimitPrice?: { price: string; id: number };
  onDirectionChange: (direction: OrderDirection) => void;
  onOrderTypeChange: (orderType: OrderType) => void;
  onSubmit: (formState: OrderFormState) => void;
  onReversePosition?: () => void;
  onClosePosition?: () => void;
};

export const PerpsMarketExpandedOrderTicket: React.FC<
  PerpsMarketExpandedOrderTicketProps
> = ({
  asset,
  currentPrice,
  markPrice,
  maxLeverage,
  availableBalance,
  direction,
  orderType,
  midPrice,
  initialLeverage,
  isPending,
  existingPosition,
  prefillLimitPrice,
  onDirectionChange,
  onOrderTypeChange,
  onSubmit,
  onReversePosition,
  onClosePosition,
}) => {
  const t = useI18nContext();
  const hasExistingPosition = Boolean(existingPosition);
  const closeLabel =
    direction === 'long' ? t('perpsCloseLong') : t('perpsCloseShort');

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className={twMerge(
        'min-h-0 overflow-hidden px-3 py-3',
        isPending && 'pointer-events-none opacity-50',
      )}
      data-testid="perps-expanded-order-ticket"
    >
      {hasExistingPosition ? (
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Between}
          className="shrink-0 pb-4"
          data-testid="perps-expanded-position-ticket-actions"
        >
          <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
            {t('perpsModifyPosition')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={3}
          >
            <Text
              asChild
              variant={TextVariant.BodyXs}
              color={TextColor.TextDefault}
            >
              <button
                type="button"
                className="rounded bg-transparent p-0 text-right hover:text-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={onReversePosition}
                disabled={!onReversePosition}
                data-testid="perps-expanded-ticket-reverse-position"
              >
                {t('perpsReversePosition')}
              </button>
            </Text>
            <Text
              asChild
              variant={TextVariant.BodyXs}
              color={TextColor.TextDefault}
            >
              <button
                type="button"
                className="rounded bg-transparent p-0 text-right hover:text-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={onClosePosition}
                disabled={!onClosePosition}
                data-testid="perps-expanded-ticket-close-position"
              >
                {closeLabel}
              </button>
            </Text>
          </Box>
        </Box>
      ) : (
        <Box className="shrink-0 pb-4">
          <DirectionTabs
            direction={direction}
            onDirectionChange={onDirectionChange}
          />
        </Box>
      )}
      <OrderEntry
        asset={asset}
        currentPrice={currentPrice}
        markPrice={markPrice}
        maxLeverage={maxLeverage}
        availableBalance={availableBalance}
        initialDirection={direction}
        mode={hasExistingPosition ? 'modify' : 'new'}
        existingPosition={existingPosition}
        orderType={orderType}
        midPrice={midPrice}
        onOrderTypeChange={onOrderTypeChange}
        initialLeverage={initialLeverage}
        showSubmitButton
        onSubmit={onSubmit}
        autoFocusLimitPrice
        prefillLimitPrice={prefillLimitPrice}
      />
    </Box>
  );
};
