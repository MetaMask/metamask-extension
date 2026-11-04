import React from 'react';
import { useSelector } from 'react-redux';
import type { QuoteResponse } from '@metamask/bridge-controller';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PopoverPosition } from '../../../components/component-library';
import { RouteMessengerProvider } from '../../../contexts/route-messenger';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import {
  getIsSwapsRebateBannerEnabled,
  useSwapsRebate,
} from '../../../hooks/bridge/useSwapsRebate';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SWAPS_REBATE_ALLOWED_CAPABILITIES } from '../../../hooks/rewards/rewards-money-messenger';
import { Tooltip } from '../layout';

const SwapsRebateBannerContent = ({
  quote,
}: {
  quote?: QuoteResponse['quote'];
}) => {
  const t = useI18nContext();
  const rebatePercent = useSwapsRebate(quote);

  if (!rebatePercent) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
      className="w-full rounded-lg bg-muted px-3 py-2"
      data-testid="swaps-rebate-banner"
    >
      <img src="./images/money.png" width={16} height={16} alt="" />
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextDefault}
        className="flex-1"
      >
        {t('swapsRebateBanner', [rebatePercent])}
      </Text>
      <Tooltip
        title={t('swapsRebateTooltipTitle')}
        position={PopoverPosition.TopEnd}
        offset={[16, 16]}
        // Must paint above the sticky CTA footer (z-10).
        style={{ zIndex: 20 }}
      >
        {t('swapsRebateTooltipContent', [rebatePercent])}
      </Tooltip>
    </Box>
  );
};

/**
 * Loads the rebate for the active Swaps quote and shows it above the CTA.
 */
export const SwapsRebateBanner = () => {
  const isEnabled = useSelector(getIsSwapsRebateBannerEnabled);
  const { activeQuote } = useSelector(getBridgeQuotes);

  if (!isEnabled) {
    return null;
  }

  return (
    <RouteMessengerProvider
      path="bridge-swaps-rebate"
      capabilities={SWAPS_REBATE_ALLOWED_CAPABILITIES}
    >
      <SwapsRebateBannerContent quote={activeQuote?.quote} />
    </RouteMessengerProvider>
  );
};
