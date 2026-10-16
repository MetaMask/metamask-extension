import { useCallback } from 'react';
import { useStore } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import {
  MetaMetricsAccountHiddenLocation,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getAccountWalletMetricProps } from '../../../helpers/utils/account-wallet';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  getAccountListStats,
  getAccountTree,
} from '../../../selectors/multichain-accounts/account-tree';
import { type MultichainAccountsState } from '../../../selectors/multichain-accounts/account-tree.types';

export type TrackAccountHidden = (
  accountGroupId: AccountGroupId,
  hidden: boolean,
  location: MetaMetricsAccountHiddenLocation,
) => void;

/**
 * Returns a function that tracks `Account Hidden` for a hide or reveal whose
 * `setAccountGroupHidden` dispatch has just resolved.
 *
 * That action swallows background errors and refreshes the store before it
 * resolves, so the event is built from the store rather than from what the
 * caller asked for:
 *
 * - The event is skipped when the stored value does not match `hidden`. Either
 * the write failed, or a later toggle of the same account has already landed
 * and reports for itself.
 * - `hidden_count_after` is counted across the whole tree after the write, so
 * it includes every other hide that has settled in the meantime.
 *
 * The store is read on demand instead of subscribed to, so callers do not
 * re-render on every dispatch to serve a metrics property.
 *
 * @returns The tracking function.
 */
export const useTrackAccountHidden = (): TrackAccountHidden => {
  const store = useStore<MultichainAccountsState>();
  const { trackEvent, createEventBuilder } = useAnalytics();

  return useCallback(
    (accountGroupId, hidden, location) => {
      const state = store.getState();
      const wallet = Object.values(getAccountTree(state).wallets).find(
        (candidate) => Boolean(candidate.groups?.[accountGroupId]),
      );
      const storedHidden =
        wallet?.groups[accountGroupId]?.metadata.hidden ?? false;

      if (!wallet || storedHidden !== hidden) {
        return;
      }

      trackEvent(
        createEventBuilder(MetaMetricsEventName.AccountHidden)
          .addCategory(MetaMetricsEventCategory.Accounts)
          .addProperties({
            ...getAccountWalletMetricProps(wallet),
            hidden,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hidden_count_after: getAccountListStats(state).hiddenCount,
            location,
          })
          .build(),
      ).catch(() => undefined);
    },
    [createEventBuilder, store, trackEvent],
  );
};
