import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import log from 'loglevel';
import {
  setFeatureAnnouncementsEnabled,
  checkAccountsPresence,
  deleteOnChainTriggersByAccount,
  updateOnChainTriggersByAccount,
  hideLoadingIndication,
} from '../../store/actions';
import { getIsUpdatingMetamaskNotificationsAccount } from '../../selectors/metamask-notifications/metamask-notifications';

export function useSwitchFeatureAnnouncementsChange(): {
  onChange: (state: boolean) => Promise<void>;
  error: null | string;
} {
  const dispatch = useDispatch();

  const [error, setError] = useState<null | string>(null);

  const onChange = useCallback(
    async (state: boolean) => {
      setError(null);

      try {
        await dispatch(setFeatureAnnouncementsEnabled(state));
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        setError(errorMessage);
        throw e;
      }
    },
    [dispatch],
  );

  return {
    onChange,
    error,
  };
}

export type UseSwitchAccountNotificationsData = { [address: string]: boolean };

export function useSwitchAccountNotifications(): {
  switchAccountNotifications: (
    accounts: string[],
  ) => Promise<UseSwitchAccountNotificationsData | undefined>;
  isLoading: boolean;
  error: string | null;
} {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchAccountNotifications = useCallback(
    async (
      accounts: string[],
    ): Promise<UseSwitchAccountNotificationsData | undefined> => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await dispatch(checkAccountsPresence(accounts));
        return data as unknown as UseSwitchAccountNotificationsData;
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        setError(errorMessage);
        log.error(errorMessage);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch],
  );

  return { switchAccountNotifications, isLoading, error };
}

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
          await dispatch(updateOnChainTriggersByAccount(addresses));
        } else {
          await dispatch(deleteOnChainTriggersByAccount(addresses));
        }
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : JSON.stringify(e ?? '');
        log.error(errorMessage);
        setError(errorMessage);
        throw e;
      }
      dispatch(hideLoadingIndication());
    },
    [dispatch],
  );

  return {
    onChange,
    error,
  };
}

function useRefetchAccountSettings() {
  const dispatch = useDispatch();

  const getAccountSettings = useCallback(async (accounts: string[]) => {
    try {
      const result = (await dispatch(
        checkAccountsPresence(accounts),
      )) as unknown as UseSwitchAccountNotificationsData;

      return result;
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
  const fetchAccountSettings = useRefetchAccountSettings();
  const [data, setData] = useState<UseSwitchAccountNotificationsData>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      const memoAccounts: string[] = JSON.parse(jsonAccounts);
      update(memoAccounts);
    } catch {
      setError('Failed to get account settings');
    } finally {
      setLoading(false);
    }
  }, [jsonAccounts, fetchAccountSettings]);

  return {
    data,
    initialLoading: loading,
    error,
    accountsBeingUpdated,
    update,
  };
}
