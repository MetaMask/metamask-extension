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
   * positive, the original fee is struck through and the discounted fee
   * is shown alongside it.
   */
  metamaskFeeRateDiscountPercentage?: number;
  /** Raw fee amount in USD. When `undefined`, a placeholder is rendered. */
  fee: number | undefined;
  /** When true, the formatted fee is prefixed with `-` (e.g. for deductions). */
  negated?: boolean;
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
  /**
   * When true, renders the {@link RewardsVipBadge} inline with the fee
   * value. The badge fetches the selected account's VIP tier from the
   * background and self-hides when no tier applies.
   */
  showVipBadge?: boolean;
};

/**
 * Renders the estimated fee text with an optional strikethrough original and
 * discounted fee when a MetaMask fee discount is active, plus an optional VIP
 * tier badge.
 *
 * @param props - Component props.
 * @param props.metamaskFeeRateDiscountPercentage - MetaMask fee discount in whole percentage points. When positive, the original fee is struck through and the discounted fee appears next to it.
 * @param props.fee - Raw fee amount in USD.
 * @param props.negated - When true, the formatted fee is prefixed with `-`.
 * @param props.placeholder - Text shown when `fee` is `undefined` (defaults to `"-"`).
 * @param props.variant - Text variant for the fee value (defaults to BodySm).
 * @param props.feeTextColor - Text color for the fee value (defaults to TextDefault).
 * @param props.feeTextFontWeight - Optional font weight for the fee value.
 * @param props.feeTextTestId - Optional testid forwarded to the fee value text node.
 * @param props.showVipBadge - When true, renders the VIP badge inline.
 */
export const PerpsFeesDisplay: React.FC<PerpsFeesDisplayProps> = ({
  metamaskFeeRateDiscountPercentage,
  fee,
  negated = false,
  placeholder = '-',
  variant = TextVariant.BodySm,
  feeTextColor = TextColor.TextDefault,
  feeTextFontWeight,
  feeTextTestId,
  showVipBadge = false,
}) => {
  const formatFee = useCallback(
    (amount: number): string => {
      const formatted = formatPerpsFiat(amount, {
        ranges: PRICE_RANGES_MINIMAL_VIEW,
      });
      return negated ? `-${formatted}` : formatted;
    },
    [negated],
  );

  const { feeText, discountedFeeText } = useMemo(() => {
    if (fee === undefined) {
      return { feeText: placeholder, discountedFeeText: undefined };
    }

    const text = formatFee(fee);

    if (
      metamaskFeeRateDiscountPercentage !== undefined &&
      metamaskFeeRateDiscountPercentage > 0
    ) {
      const discountedFee =
        fee * (1 - metamaskFeeRateDiscountPercentage / 100);
      return { feeText: text, discountedFeeText: formatFee(discountedFee) };
    }

    return { feeText: text, discountedFeeText: undefined };
  }, [fee, placeholder, metamaskFeeRateDiscountPercentage, formatFee]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={1}
    >
      {showVipBadge ? <RewardsVipBadge /> : null}
      {discountedFeeText === undefined ? (
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
            {feeText}
          </Text>
          <Text
            variant={variant}
            color={feeTextColor}
            fontWeight={feeTextFontWeight}
            data-testid={feeTextTestId}
          >
            {discountedFeeText}
          </Text>
        </>
      )}
    </Box>
  );
};

export default PerpsFeesDisplay;
