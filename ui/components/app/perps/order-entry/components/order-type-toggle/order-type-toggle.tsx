import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonBase,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';

import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import type { OrderType } from '../../../types';

export type OrderTypeToggleProps = {
  orderType: OrderType;
  onOrderTypeChange: (orderType: OrderType) => void;
};

/**
 * Market/Limit selector shared by perps opening and closing flows.
 *
 * @param props - Component props.
 * @param props.orderType - Currently selected order type.
 * @param props.onOrderTypeChange - Called when the selected order type changes.
 */
export const OrderTypeToggle = ({
  orderType,
  onOrderTypeChange,
}: OrderTypeToggleProps) => {
  const t = useI18nContext();

  const renderOrderTypeButton = (type: OrderType, label: string) => {
    const isSelected = orderType === type;

    return (
      <ButtonBase
        type="button"
        onClick={() => {
          if (!isSelected) {
            onOrderTypeChange(type);
          }
        }}
        aria-pressed={isSelected}
        className={twMerge(
          'h-auto min-w-0 rounded-full border-0 px-4 py-1 transition-colors',
          isSelected
            ? 'bg-muted hover:bg-muted-hover active:bg-muted-pressed'
            : 'bg-default hover:bg-hover active:bg-pressed',
        )}
        textProps={{
          variant: TextVariant.BodySm,
          color: isSelected ? TextColor.TextDefault : TextColor.TextAlternative,
        }}
        data-testid={`order-type-${type}`}
      >
        {label}
      </ButtonBase>
    );
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
      className="w-full"
      data-testid="order-type-toggle"
    >
      {renderOrderTypeButton('market', t('perpsMarket'))}
      {renderOrderTypeButton('limit', t('perpsLimit'))}
    </Box>
  );
};
