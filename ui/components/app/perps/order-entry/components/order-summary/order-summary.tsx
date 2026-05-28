import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { PerpsFeesDisplay } from '../../../perps-fees-display';
import type { OrderSummaryProps } from '../../order-entry.types';
import {
  formatSlippageRowValue,
} from '../../../utils/slippageFormat';

/**
 * OrderSummary - Displays calculated order values (margin, fees, liquidation price, slippage)
 *
 * @param props - Component props
 * @param props.marginRequired - Margin required for the position
 * @param props.estimatedFees - Estimated trading fees (after discount)
 * @param props.originalEstimatedFees - Estimated trading fees before discount
 * @param props.liquidationPrice - Estimated liquidation price
 * @param props.slippage - Optional slippage row config (estimated + max with click handler)
 * @param props.metamaskFeeRateDiscountPercentage - MetaMask fee discount percentage (whole numbers)
 */
export const OrderSummary: React.FC<OrderSummaryProps> = ({
  marginRequired,
  estimatedFees,
  originalEstimatedFees,
  liquidationPrice,
  slippage,
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

      {slippage && (
        <Box
          as="button"
          type="button"
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          onClick={slippage.onMaxSlippageClick}
          data-testid="perps-order-summary-slippage-row"
          className="cursor-pointer bg-transparent border-0 p-0"
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsSlippage')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
          >
            <Text
              variant={TextVariant.BodySm}
              color={
                slippage.exceedsMax
                  ? TextColor.ErrorDefault
                  : TextColor.TextDefault
              }
              data-testid="perps-order-summary-slippage-value"
            >
              {formatSlippageRowValue(
                slippage.estimatedPct,
                slippage.maxSlippagePct,
                slippage.insufficientLiquidity,
              )}
            </Text>
            <Icon
              name={IconName.Edit}
              size={IconSize.Xs}
              color={TextColor.TextAlternative}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default OrderSummary;
