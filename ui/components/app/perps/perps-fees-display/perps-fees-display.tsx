import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { RewardsVipBadge } from '../../rewards/RewardsVipBadge';

export type PerpsFeesDisplayProps = {
  /**
   * MetaMask fee discount in whole percentage points. When `undefined`, `0`,
   * or negative, the discount badge is not rendered (matching mobile's
   * `PerpsFeesDisplay`).
   */
  metamaskFeeRateDiscountPercentage?: number;
  /** Pre-formatted fee text (e.g. `"$0.50"`). Always rendered. */
  formatFeeText: string;
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
 * Renders the estimated fee text with an inline `-X%` warning-colored badge
 * when a MetaMask fee discount is active, and an optional VIP tier badge.
 * Mirrors mobile's
 * `app/components/UI/Perps/components/PerpsFeesDisplay/PerpsFeesDisplay.tsx`.
 *
 * The discount badge is hidden entirely when `metamaskFeeRateDiscountPercentage`
 * is `undefined`, `0`, or negative — the surrounding row stays clean when no
 * discount applies.
 *
 * Extension does not have the mobile `TagColored` component, so the badge is
 * built from a `Box` with the warning-muted background plus the design
 * system's `MetamaskFoxOutline` icon, matching the existing warning-tone
 * patterns already used inside the perps UI (e.g. the partial-close min
 * notional banner in `ClosePositionModal`).
 *
 * @param props - Component props.
 * @param props.metamaskFeeRateDiscountPercentage - MetaMask fee discount in whole percentage points. The badge is hidden when this is `undefined`, `0`, or negative.
 * @param props.formatFeeText - Pre-formatted fee text (e.g. `"$0.50"`), always rendered.
 * @param props.variant - Text variant for the fee value (defaults to BodySm).
 * @param props.feeTextColor - Text color for the fee value (defaults to TextDefault).
 * @param props.feeTextFontWeight - Optional font weight for the fee value.
 * @param props.feeTextTestId - Optional testid forwarded to the fee value text node.
 * @param props.showVipBadge - When true, renders the VIP badge inline.
 */
export const PerpsFeesDisplay: React.FC<PerpsFeesDisplayProps> = ({
  metamaskFeeRateDiscountPercentage,
  formatFeeText,
  variant = TextVariant.BodySm,
  feeTextColor = TextColor.TextDefault,
  feeTextFontWeight,
  feeTextTestId,
  showVipBadge = false,
}) => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    alignItems={BoxAlignItems.Center}
    gap={1}
  >
    {showVipBadge ? <RewardsVipBadge /> : null}
    {metamaskFeeRateDiscountPercentage !== undefined &&
    metamaskFeeRateDiscountPercentage > 0 ? (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={1}
        backgroundColor={BoxBackgroundColor.WarningMuted}
        paddingLeft={1}
        paddingRight={1}
        className="rounded"
        data-testid="perps-fees-display-discount"
      >
        <Icon
          name={IconName.MetamaskFoxOutline}
          size={IconSize.Sm}
          color={IconColor.WarningDefault}
        />
        <Text variant={TextVariant.BodyXs} color={TextColor.WarningDefault}>
          {`-${metamaskFeeRateDiscountPercentage}%`}
        </Text>
      </Box>
    ) : null}
    <Text
      variant={variant}
      color={feeTextColor}
      fontWeight={feeTextFontWeight}
      data-testid={feeTextTestId}
    >
      {formatFeeText}
    </Text>
  </Box>
);

export default PerpsFeesDisplay;
