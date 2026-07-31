import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import log from 'loglevel';
import {
  checkAccountsPresence,
  disableAccounts,
  enableAccounts,
  hideLoadingIndication,
} from '../../store/actions';
import {
  getIsUpdatingMetamaskNotificationsAccount,
  selectIsMetamaskNotificationsEnabled,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { useDispatch } from '../../store/hooks';
import { useSafeState } from './useNotifications';

export type UseSwitchAccountNotificationsData = { [address: string]: boolean };

export function useSwitchAccountNotificationsChange(): {
  onChange: (addresses: string[], state: boolean) => Promise<void>;
  error: string | null;
} {
  const dispatch = useDispatch();

  const [error, setError] = useState<string | null>(null);

  const onChange = useCallback(
    async (addresses: string[], state: boolean) => {
      setError(null);

      try {
        if (state) {
          await dispatch(enableAccounts(addresses));
        } else {
          await dispatch(disableAccounts(addresses));
        }
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        log.error(errorMessage);
        setError(errorMessage);
        throw e;
      } finally {
        dispatch(hideLoadingIndication());
      }
    },
    [dispatch],
  );

  return {
    onChange,
    error,
  };
}

/**
 * `checkAccountsPresence` preserves the casing of the addresses it was called
 * with. Wallet-activity UI lookups always use lowercase keys, so normalize
 * here — otherwise misses fall through to (possibly stale) preferences and can
 * incorrectly show every account as selected after a single toggle.
 *
 * @param data - Account presence map keyed by address
 * @returns Presence map with lowercased address keys
 */
function normalizeAccountPresenceData(
  data: UseSwitchAccountNotificationsData | null | undefined,
): UseSwitchAccountNotificationsData {
  return Object.fromEntries(
    Object.entries(data ?? {}).map(([address, enabled]) => [
      address.toLowerCase(),
      enabled,
    ]),
  );
}

function useRefetchAccountSettings() {
  const dispatch = useDispatch();

  const getAccountSettings = useCallback(async (accounts: string[]) => {
    try {
      const result = (await dispatch(
        checkAccountsPresence(accounts),
      )) as unknown as UseSwitchAccountNotificationsData;

      // Preserve empty/undefined results (same as pre-normalize behavior) so
      // callers and tests don't get an extra state update from `{}`.
      if (!result || Object.keys(result).length === 0) {
        return result;
      }

      return normalizeAccountPresenceData(result);
    } catch {
      return {};
    }
  }, []);

  return getAccountSettings;
}

/**
 * Account Settings Hook.
 * Gets initial loading states, and returns enable/disable account states.
 * Also exposes an update() method so each switch can be manually updated.
 *
 * @param accounts - the accounts we are checking to see if notifications are enabled/disabled
 * @returns props for settings page
 */
export function useAccountSettingsProps(accounts: string[]) {
  const accountsBeingUpdated = useSelector(
    getIsUpdatingMetamaskNotificationsAccount,
  );
  const isEnabled = useSelector(selectIsMetamaskNotificationsEnabled);
  const fetchAccountSettings = useRefetchAccountSettings();
  const [data, setData] = useSafeState<UseSwitchAccountNotificationsData>({});
  const [loading, setLoading] = useSafeState<boolean>(false);
  const [error, setError] = useSafeState<string | null>(null);

  // Memoize the accounts array to avoid unnecessary re-fetching
  const jsonAccounts = useMemo(() => JSON.stringify(accounts), [accounts]);

  const update = useCallback(async (addresses: string[]) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAccountSettings(addresses);
      setData(res);
    } catch {
      setError('Failed to get account settings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect - async get if accounts are enabled/disabled
  useEffect(() => {
    if (!isEnabled) {
      return;
    }
    const memoAccounts: string[] = JSON.parse(jsonAccounts);
    update(memoAccounts);
  }, [jsonAccounts, fetchAccountSettings, isEnabled]);

  return {
    data,
    initialLoading: loading,
    error,
    accountsBeingUpdated,
    update,
  };
}
