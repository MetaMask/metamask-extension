import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { validatedVersionGatedFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import type { PerpsRebateTrade } from '../../../shared/types/rewards-money';
import type { PerpsRebateMessenger } from '../rewards/rewards-money-messenger';
import { useMessenger } from '../useMessenger';

export const getIsPerpsRebatesEnabled = (
  state: Parameters<typeof getRemoteFeatureFlags>[0],
): boolean =>
  validatedVersionGatedFeatureFlag(
    getRemoteFeatureFlags(state).perpsRebatesEnabled,
  ) ?? false;

export type UsePerpsRebateParams = {
  /** Hyperliquid market name, when a single trade is known. */
  coin?: string;
  /** Perps direction mapped to the Rewards Money trade side. */
  direction?: 'long' | 'short';
  /** Trade notional as a plain decimal USD string. */
  notionalUsd?: string;
};

/**
 * Builds optional trade metadata for the rebate quote.
 *
 * The controller performs the final server-format validation and omits
 * metadata that the service would reject.
 *
 * @param params - The trade the caller is about to make, when known.
 * @param params.coin - Hyperliquid market name.
 * @param params.direction - Trade direction mapped to the Rewards Money side.
 * @param params.notionalUsd - Trade notional as a plain decimal USD string.
 * @returns The trade metadata, or `undefined` when any field is missing.
 */
export function buildPerpsRebateTrade({
  coin,
  direction,
  notionalUsd,
}: UsePerpsRebateParams): PerpsRebateTrade | undefined {
  if (!coin || !direction || !notionalUsd) {
    return undefined;
  }

  return {
    coin,
    side: direction === 'long' ? 'BUY' : 'SELL',
    notionalUsd,
  };
}

/**
 * Rebate percentage of the MetaMask fee for the perps surface this is mounted
 * on, paid to the user's Money account, or `null` when no rebate should show.
 *
 * Gated by the `perpsRebatesEnabled` remote flag. Fetches once per mount and
 * never again on trade edits, matching mobile: the quote's trade metadata does
 * not change the rate today, and refetching on each amount edit would consume
 * the profile's shared Rewards Money read budget. Any error hides the banner
 * and is not retried; the controller's own retry policy covers transient
 * failures.
 *
 * @param params - The trade about to be made, when known.
 * @param params.coin - Hyperliquid market name.
 * @param params.direction - Trade direction mapped to the Rewards Money side.
 * @param params.notionalUsd - Trade notional as a plain decimal USD string.
 * @returns The rebate percentage, or `null`.
 */
export const usePerpsRebate = ({
  coin,
  direction,
  notionalUsd,
}: UsePerpsRebateParams = {}): number | null => {
  const messenger = useMessenger<PerpsRebateMessenger>();
  const isEnabled = useSelector(getIsPerpsRebatesEnabled);
  const [rebatePercent, setRebatePercent] = useState<number | null>(null);
  // The quote is fetched once per mount: trade edits re-render this hook but
  // must not cost another read, so the call reads the latest trade from a ref.
  const paramsRef = useRef<UsePerpsRebateParams>({
    coin,
    direction,
    notionalUsd,
  });

  useEffect(() => {
    paramsRef.current = { coin, direction, notionalUsd };
  });

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    let cancelled = false;
    messenger
      .call(
        'RewardsMoneyController:getPerpsRebateQuote',
        buildPerpsRebateTrade(paramsRef.current),
      )
      .then(({ eligible, rebateBips, reason }) => {
        if (!cancelled && eligible && reason === null && rebateBips > 0) {
          setRebatePercent(rebateBips / 100);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      setRebatePercent(null);
    };
  }, [isEnabled, messenger]);

  if (!isEnabled) {
    return null;
  }
  return rebatePercent;
};
