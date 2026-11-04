import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { QuoteResponse } from '@metamask/bridge-controller';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { validatedVersionGatedFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { useMessenger } from '../useMessenger';
import type { SwapsRebateMessenger } from '../rewards/rewards-money-messenger';

export const getIsSwapsRebateBannerEnabled = (
  state: Parameters<typeof getRemoteFeatureFlags>[0],
): boolean =>
  validatedVersionGatedFeatureFlag(
    getRemoteFeatureFlags(state).swapsRebateBannerEnabled,
  ) ?? false;

/**
 * Rebate percentage of the MetaMask fee for the selected swap quote, paid to
 * the user's Money account, or `null` when no rebate should show.
 *
 * Gated by the `swapsRebateBannerEnabled` remote flag. Fetches once on mount
 * and again only when the MetaMask fee token changes, never on quote refresh.
 * Any error hides the banner and is not retried.
 *
 * @param quote - The selected bridge quote.
 * @returns The rebate percentage, or `null`.
 */
export const useSwapsRebate = (
  quote?: QuoteResponse['quote'],
): number | null => {
  const messenger = useMessenger<SwapsRebateMessenger>();
  const isEnabled = useSelector(getIsSwapsRebateBannerEnabled);
  const [rebate, setRebate] = useState<{
    feeAssetId: string;
    bips: number;
  } | null>(null);
  const quoteRef = useRef(quote);
  const feeAssetId = quote?.feeData?.metabridge?.[0]?.asset?.assetId;

  useEffect(() => {
    quoteRef.current = quote;
  });

  useEffect(() => {
    const currentQuote = quoteRef.current;
    if (!isEnabled || !feeAssetId || !currentQuote) {
      return undefined;
    }

    let cancelled = false;
    messenger
      .call('RewardsMoneyController:getSwapsRebateQuote', currentQuote)
      .then(({ eligible, rebateBips, reason }) => {
        if (!cancelled && eligible && !reason) {
          setRebate({ feeAssetId, bips: rebateBips });
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      setRebate(null);
    };
  }, [isEnabled, feeAssetId, messenger]);

  if (!isEnabled || !rebate || rebate.feeAssetId !== feeAssetId) {
    return null;
  }
  return rebate.bips ? rebate.bips / 100 : null;
};
