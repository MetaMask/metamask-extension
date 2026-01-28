import React from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import type { OrderSummaryProps } from '../../order-entry.types';

/**
 * OrderSummary - Displays calculated order values (liquidation price, order value)
 *
 * @param props - Component props
 * @param props.liquidationPrice - Estimated liquidation price
 * @param props.orderValue - Total order value
 */
export const OrderSummary: React.FC<OrderSummaryProps> = ({
  liquidationPrice,
  orderValue,
}) => {
  const t = useI18nContext();

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      {/* Liquidation Price Row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsLiquidationPriceEst')}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {liquidationPrice ?? 'N/A'}
        </Text>
      </Box>

      {/* Order Value Row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsOrderValue')}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {orderValue ?? 'N/A'}
        </Text>
      </Box>
    </Box>
  );
};

export default OrderSummary;
