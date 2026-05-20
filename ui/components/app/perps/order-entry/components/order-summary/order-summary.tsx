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
import { PerpsFeesDisplay } from '../../../perps-fees-display';
import type { OrderSummaryProps } from '../../order-entry.types';

/**
 * OrderSummary - Displays calculated order values (margin, fees, liquidation price)
 *
 * @param props - Component props
 * @param props.marginRequired - Margin required for the position
 * @param props.estimatedFees - Estimated trading fees (after discount)
 * @param props.originalEstimatedFees - Estimated trading fees before discount
 * @param props.liquidationPrice - Estimated liquidation price
 * @param props.metamaskFeeRateDiscountPercentage - MetaMask fee discount percentage (whole numbers)
 */
export const OrderSummary: React.FC<OrderSummaryProps> = ({
  marginRequired,
  estimatedFees,
  originalEstimatedFees,
  liquidationPrice,
  metamaskFeeRateDiscountPercentage,
}) => {
  const t = useI18nContext();

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      {/* Liquidation price */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsLiquidationPrice')}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextDefault}
          data-testid="perps-order-summary-liquidation-price"
        >
          {liquidationPrice ?? '-'}
        </Text>
      </Box>

      {/* Margin */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsMargin')}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextDefault}
          data-testid="perps-order-summary-margin-required"
        >
          {marginRequired ?? '-'}
        </Text>
      </Box>

      {/* Fees */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsFees')}
        </Text>
        <PerpsFeesDisplay
          metamaskFeeRateDiscountPercentage={
            estimatedFees === null
              ? undefined
              : metamaskFeeRateDiscountPercentage
          }
          originalFee={originalEstimatedFees ?? undefined}
          fee={estimatedFees ?? undefined}
          feeTextTestId="perps-order-summary-estimated-fees"
        />
      </Box>
    </Box>
  );
};

export default OrderSummary;
