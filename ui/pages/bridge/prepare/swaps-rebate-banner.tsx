import React from 'react';
import { useSelector } from 'react-redux';
import type { QuoteResponse } from '@metamask/bridge-controller';
import { RebateBanner } from '../../../components/app/rebates';
import { RouteMessengerProvider } from '../../../contexts/route-messenger';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import {
  getIsSwapsRebateBannerEnabled,
  useSwapsRebate,
} from '../../../hooks/bridge/useSwapsRebate';
import { SWAPS_REBATE_ALLOWED_CAPABILITIES } from '../../../hooks/rewards/rewards-money-messenger';

const SwapsRebateBannerContent = ({
  quote,
}: {
  quote?: QuoteResponse['quote'];
}) => {
  const rebatePercent = useSwapsRebate(quote);

  if (!rebatePercent) {
    return null;
  }

  return (
    <RebateBanner rebatePercent={rebatePercent} testId="swaps-rebate-banner" />
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
