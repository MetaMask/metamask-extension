import React from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Icon,
  IconColor,
  IconName,
  IconSize,
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
 * @param props.showSlippageRow
 * @param props.slippageDisplay
 * @param props.exceedsMaxSlippage
 * @param props.onSlippageClick
 */
export const OrderSummary = ({
  marginRequired,
  estimatedFees,
  originalEstimatedFees,
  liquidationPrice,
  metamaskFeeRateDiscountPercentage,
  showSlippageRow = false,
  slippageDisplay,
  exceedsMaxSlippage = false,
  onSlippageClick,
}: OrderSummaryProps) => {
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

      {showSlippageRow && (
        <button
          type="button"
          onClick={onSlippageClick}
          data-testid="perps-order-summary-slippage-row"
          aria-label={t('perpsSlippageEditAriaLabel')}
          className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left"
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
                exceedsMaxSlippage
                  ? TextColor.ErrorDefault
                  : TextColor.TextDefault
              }
              data-testid="perps-order-summary-slippage-value"
            >
              {slippageDisplay ?? '-'}
            </Text>
            {exceedsMaxSlippage ? (
              <span
                className="sr-only"
                aria-live="polite"
                data-testid="perps-order-slippage-exceeds-indicator"
              >
                {t('perpsSlippageExceeded')}
              </span>
            ) : null}
            <Icon
              name={IconName.Edit}
              size={IconSize.Sm}
              color={IconColor.IconAlternative}
            />
          </Box>
        </button>
      )}

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
