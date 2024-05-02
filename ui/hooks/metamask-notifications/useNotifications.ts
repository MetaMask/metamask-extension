import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-api';
import { selectIsMetamaskNotificationsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';
import {
  createOnChainTriggers,
  deleteOnChainTriggersByAccount,
  fetchAndUpdateMetamaskNotifications,
  setMetamaskNotificationsEnabled,
  setSnapNotificationsEnabled,
  setFeatureAnnouncementsEnabled,
  markMetamaskNotificationsAsRead,
} from '../../store/actions';
import { getInternalAccounts } from '../../selectors';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import type { MarkAsReadNotificationsParam } from '../../../app/scripts/controllers/metamask-notifications/types/notification/notification';

// Define KeyringType interface
type KeyringType = {
  type: string;
};

// Define AccountType interface
type AccountType = InternalAccount & {
  balance: string;
  keyring: KeyringType;
  label: string;
};

/**
 * Custom hook to enable notifications by creating on-chain triggers.
 * It manages loading and error states internally.
 *
 * @returns An object containing the `enableNotifications` function, loading state, and error state.
 */
export function useEnableNotifications(): {
  enableNotifications: () => Promise<void>;
  loading: boolean;
  error: string | null;
} {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const enableNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await dispatch(createOnChainTriggers());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }

    setLoading(false);
  }, [dispatch]);

  return {
    enableNotifications,
    loading,
    error,
  };
}

/**
 * Custom hook to disable notifications by deleting on-chain triggers associated with accounts.
 * It also disables snap and feature announcements. Manages loading and error states internally.
 *
 * @returns An object containing the `disableNotifications` function, loading state, and error state.
 */
export function useDisableNotifications(): {
  disableNotifications: () => Promise<void>;
  loading: boolean;
  error: string | null;
} {
  const dispatch = useDispatch();
  const accounts: AccountType[] = useSelector(getInternalAccounts);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const disableNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const checksumAddresses = accounts.map((account: AccountType) =>
        toChecksumHexAddress(account.address),
      );

      await dispatch(deleteOnChainTriggersByAccount(checksumAddresses));

      await dispatch(setSnapNotificationsEnabled(false));
      await dispatch(setFeatureAnnouncementsEnabled(false));
      await dispatch(setMetamaskNotificationsEnabled(false));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }

    setLoading(false);
  }, [dispatch, accounts]);

  return {
    disableNotifications,
    loading,
    error,
  };
}

/**
 * Custom hook to check if notifications are enabled by accessing the Redux state.
 *
 * @returns An object containing the current state of notification enablement.
 */
export function useIsNotificationEnabled(): {
  isNotificationEnabled: boolean;
} {
  const isNotificationEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

  return {
    isNotificationEnabled,
  };
}

/**
 * Custom hook to fetch and update the list of notifications.
 * Manages loading and error states internally.
 *
 * @returns An object containing the `listNotifications` function, loading state, and error state.
 */
export function useListNotifications(): {
  listNotifications: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
} {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const listNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await dispatch(fetchAndUpdateMetamaskNotifications());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }

    setLoading(false);
  }, [dispatch]);

  return {
    listNotifications,
    isLoading: loading,
    error,
  };
}

/**
 * Custom hook to mark specific notifications as read.
 * It accepts a parameter of notifications to be marked as read and manages loading and error states internally.
 *
 * @param notifications - The notifications to mark as read.
 * @returns An object containing the `markNotificationAsRead` function, loading state, and error state.
 */
export function useMarkNotificationAsRead(
  notifications: MarkAsReadNotificationsParam,
): {
  markNotificationAsRead: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
} {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const markNotificationAsRead = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await dispatch(markMetamaskNotificationsAsRead(notifications));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }

    setLoading(false);
  }, [dispatch]);

  return {
    markNotificationAsRead,
    isLoading: loading,
    error,
  };
}
