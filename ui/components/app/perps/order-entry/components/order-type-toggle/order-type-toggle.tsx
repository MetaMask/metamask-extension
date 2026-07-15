import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  twMerge,
} from '@metamask/design-system-react';

import {
  BackgroundColor,
  BorderRadius,
  TextColor,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { Tag } from '../../../../../component-library';
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

  const renderTag = (type: OrderType, label: string) => {
    const isSelected = orderType === type;

    return (
      <Tag
        as="button"
        type="button"
        label={label}
        onClick={() => {
          if (!isSelected) {
            onOrderTypeChange(type);
          }
        }}
        backgroundColor={
          isSelected
            ? BackgroundColor.backgroundMuted
            : BackgroundColor.backgroundDefault
        }
        borderWidth={0}
        borderRadius={BorderRadius.pill}
        className={twMerge(
          'cursor-pointer transition-colors',
          !isSelected && 'hover:opacity-80',
        )}
        labelProps={{
          color: isSelected
            ? TextColor.textDefault
            : TextColor.textAlternative,
        }}
        padding={4}
        data-testid={`order-type-${type}`}
      />
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
      {renderTag('market', t('perpsMarket'))}
      {renderTag('limit', t('perpsLimit'))}
    </Box>
  );
};
