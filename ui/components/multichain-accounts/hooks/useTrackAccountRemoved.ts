import { useCallback } from 'react';
import type { AccountWalletObject } from '@metamask/account-tree-controller';
import {
  MetaMetricsAccountRemovedLocation,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getAccountWalletMetricProps } from '../../../helpers/utils/account-wallet';
import { useAnalytics } from '../../../hooks/useAnalytics';

export type TrackAccountRemoved = (
  wallet: AccountWalletObject | undefined,
  location: MetaMetricsAccountRemovedLocation,
) => void;

/**
 * Returns a function that tracks `Account Removed` for a removal whose
 * `removeAccount` dispatch has just resolved.
 *
 * Unlike `Account Hidden` (see `useTrackAccountHidden`), the outcome cannot be
 * read back from the store: once the removal succeeds, the wallet is gone. So
 * callers capture the wallet before removing, and rely on `removeAccount`
 * rejecting when the background fails. Calling this only after an awaited
 * removal resolves means a failed removal is never reported.
 *
 * @returns The tracking function.
 */
export const useTrackAccountRemoved = (): TrackAccountRemoved => {
  const { trackEvent, createEventBuilder } = useAnalytics();

  return useCallback(
    (wallet, location) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.AccountRemoved)
          .addCategory(MetaMetricsEventCategory.Accounts)
          .addProperties({
            ...getAccountWalletMetricProps(wallet),
            location,
          })
          .build(),
      ).catch(() => undefined);
    },
    [createEventBuilder, trackEvent],
  );
};
