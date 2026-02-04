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
 * OrderSummary - Displays calculated order values (margin, fees, liquidation price)
 *
 * @param props - Component props
 * @param props.marginRequired - Margin required for the position
 * @param props.estimatedFees - Estimated trading fees
 * @param props.liquidationPrice - Estimated liquidation price
 */
export const OrderSummary: React.FC<OrderSummaryProps> = ({
  marginRequired,
  estimatedFees,
  liquidationPrice,
}) => {
  const t = useI18nContext();

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      {/* Margin Row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsMargin')}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
          {marginRequired ?? '-'}
        </Text>
      </Box>

      {/* Fees Row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsFees')}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
          {estimatedFees ?? '-'}
        </Text>
      </Box>

      {/* Liquidation Price Row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsLiquidationPriceEst')}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
          {liquidationPrice ?? '-'}
        </Text>
      </Box>
    </Box>
  );
};

export default OrderSummary;
