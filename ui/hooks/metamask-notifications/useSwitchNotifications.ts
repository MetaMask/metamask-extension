import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import log from 'loglevel';
import {
  setFeatureAnnouncementsEnabled,
  checkAccountsPresence,
  deleteOnChainTriggersByAccount,
  updateOnChainTriggersByAccount,
  hideLoadingIndication,
} from '../../store/actions';

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
