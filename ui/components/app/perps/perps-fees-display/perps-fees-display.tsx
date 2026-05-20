import React, { useCallback, useMemo } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  formatPerpsFiat,
  PRICE_RANGES_MINIMAL_VIEW,
} from '../../../../../shared/lib/perps-formatters';
import { RewardsVipBadge } from '../../rewards/RewardsVipBadge';

export type PerpsFeesDisplayProps = {
  /**
   * MetaMask fee discount in whole percentage points. When defined and
   * positive, a VIP badge is rendered and (if `originalFee` is also provided)
   * the pre-discount fee is shown struck-through.
   */
  metamaskFeeRateDiscountPercentage?: number;
  /**
   * Fee amount in USD **before** any VIP discount. Shown struck-through when
   * a discount is active. When `undefined` the struck-through row is omitted.
   */
  originalFee?: number;
  /**
   * Fee amount in USD **after** any VIP discount has already been applied.
   * When `undefined`, a placeholder is rendered.
   */
  fee: number | undefined;
  /** Text shown when `fee` is `undefined` (defaults to `"-"`). */
  placeholder?: string;
  /** Optional override for the fee text variant (defaults to BodySm). */
  variant?: TextVariant;
  /** Optional override for the fee text color (defaults to TextDefault). */
  feeTextColor?: TextColor;
  /** Optional override for the fee text font weight. */
  feeTextFontWeight?: FontWeight;
  /** Optional override for the testid on the fee text element. */
  feeTextTestId?: string;
};

/**
 * Renders the estimated fee text with an optional strikethrough original and
 * discounted fee when a MetaMask fee discount is active, plus an optional VIP
 * tier badge.
 *
 * @param props - Component props.
 * @param props.metamaskFeeRateDiscountPercentage - MetaMask fee discount in whole percentage points. Controls VIP badge visibility and struck-through original fee display.
 * @param props.originalFee - Fee amount in USD before discount. Shown struck-through when a discount is active.
 * @param props.fee - Fee amount in USD after any VIP discount has been applied.
 * @param props.placeholder - Text shown when `fee` is `undefined` (defaults to `"-"`).
 * @param props.variant - Text variant for the fee value (defaults to BodySm).
 * @param props.feeTextColor - Text color for the fee value (defaults to TextDefault).
 * @param props.feeTextFontWeight - Optional font weight for the fee value.
 * @param props.feeTextTestId - Optional testid forwarded to the fee value text node.
 */
export const PerpsFeesDisplay: React.FC<PerpsFeesDisplayProps> = ({
  metamaskFeeRateDiscountPercentage,
  originalFee,
  fee,
  placeholder = '-',
  variant = TextVariant.BodySm,
  feeTextColor = TextColor.TextDefault,
  feeTextFontWeight,
  feeTextTestId,
}) => {
  const formatFee = useCallback(
    (amount: number): string =>
      formatPerpsFiat(amount, { ranges: PRICE_RANGES_MINIMAL_VIEW }),
    [],
  );

  const { feeText, originalFeeText } = useMemo(() => {
    if (fee === undefined) {
      return { feeText: placeholder, originalFeeText: undefined };
    }

    const text = formatFee(fee);

    if (
      metamaskFeeRateDiscountPercentage !== undefined &&
      metamaskFeeRateDiscountPercentage > 0 &&
      originalFee !== undefined &&
      originalFee > fee
    ) {
      return { feeText: text, originalFeeText: formatFee(originalFee) };
    }

    return { feeText: text, originalFeeText: undefined };
  }, [
    fee,
    placeholder,
    metamaskFeeRateDiscountPercentage,
    originalFee,
    formatFee,
  ]);

  const showVipBadge =
    metamaskFeeRateDiscountPercentage !== undefined &&
    metamaskFeeRateDiscountPercentage > 0;

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={1}
    >
      {showVipBadge ? <RewardsVipBadge /> : null}
      {originalFeeText === undefined ? (
        <Text
          variant={variant}
          color={feeTextColor}
          fontWeight={feeTextFontWeight}
          data-testid={feeTextTestId}
        >
          {feeText}
        </Text>
      ) : (
        <>
          <Text
            variant={variant}
            color={TextColor.TextAlternative}
            style={{ textDecoration: 'line-through' }}
            data-testid={
              feeTextTestId ? `${feeTextTestId}-original` : undefined
            }
          >
            {originalFeeText}
          </Text>
          <Text
            variant={variant}
            color={feeTextColor}
            fontWeight={feeTextFontWeight}
            data-testid={feeTextTestId}
          >
            {feeText}
          </Text>
        </>
      )}
    </Box>
  );
};

export default PerpsFeesDisplay;
