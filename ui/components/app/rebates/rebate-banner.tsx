import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PopoverPosition } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Tooltip } from '../../../pages/bridge/layout';

type RebateBannerProps = {
  /**
   * The rebate percentage to display, e.g. `10` renders "You're getting 10%
   * back on fees".
   */
  rebatePercent: number;
  /** The `data-testid` of the banner. */
  testId: string;
  /** Extra classes appended to the banner's box, e.g. a margin. */
  className?: string;
};

/**
 * Shared fee-rebate presentation for trading confirmations.
 *
 * Product-specific wrappers own eligibility and data fetching. This component
 * only renders the common copy and educational tooltip.
 */
export const RebateBanner = ({
  rebatePercent,
  testId,
  className,
}: RebateBannerProps) => {
  const t = useI18nContext();

  if (rebatePercent <= 0) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
      className={
        className
          ? `w-full rounded-lg bg-muted px-3 py-2 ${className}`
          : 'w-full rounded-lg bg-muted px-3 py-2'
      }
      data-testid={testId}
    >
      <img src="./images/money.png" width={16} height={16} alt="" />
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextDefault}
        className="flex-1"
      >
        {t('rebateBanner', [rebatePercent])}
      </Text>
      <Tooltip
        title={t('rebateTooltipTitle')}
        position={PopoverPosition.TopEnd}
        offset={[16, 16]}
        // Must paint above the sticky CTA footer (z-10).
        style={{ zIndex: 20 }}
      >
        {t('rebateTooltipContent', [rebatePercent])}
      </Tooltip>
    </Box>
  );
};
