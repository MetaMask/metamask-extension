import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-api';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import log from 'loglevel';

import {
  createOnChainTriggers,
  fetchAndUpdateMetamaskNotifications,
  markMetamaskNotificationsAsRead,
  enableMetamaskNotifications,
  disableMetamaskNotifications,
} from '../../store/actions';

type Notification = NotificationServicesController.Types.INotification;
type MarkAsReadNotificationsParam =
  NotificationServicesController.Types.MarkAsReadNotificationsParam;

// Define KeyringType interface
type KeyringType = {
  type: string;
};

// Define AccountType interface
export type AccountType = InternalAccount & {
  balance: string;
  keyring: KeyringType;
  label: string;
};

/**
 * Custom hook to fetch and update the list of notifications.
 * Manages loading and error states internally.
 *
 * @returns An object containing the `listNotifications` function, loading state, and error state.
 */
export function useListNotifications(): {
  listNotifications: () => Promise<Notification[] | undefined>;
  notificationsData?: Notification[];
  isLoading: boolean;
  error?: unknown;
} {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [notificationsData, setNotificationsData] = useState<
    Notification[] | undefined
  >(undefined);

  const listNotifications = useCallback(async (): Promise<
    Notification[] | undefined
  > => {
    setLoading(true);
    setError(null);

    try {
      const data = await dispatch(fetchAndUpdateMetamaskNotifications());
      setNotificationsData(data as unknown as Notification[]);
      return data as unknown as Notification[];
    } catch (e) {
      log.error(e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return {
    listNotifications,
    notificationsData,
    isLoading: loading,
    error,
  };
}

/**
 * Custom hook to enable notifications by creating on-chain triggers.
 * It manages loading and error states internally.
 *
 * @returns An object containing the `enableNotifications` function, loading state, and error state.
 */
export function useCreateNotifications(): {
  createNotifications: () => Promise<void>;
  error: string | null;
} {
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);

  const createNotifications = useCallback(async () => {
    setError(null);

    try {
      await dispatch(createOnChainTriggers());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      log.error(e);
      throw e;
    }
  }, [dispatch]);

  return {
    createNotifications,
    error,
  };
}

/**
 * Custom hook to enable MetaMask notifications.
 * This hook encapsulates the logic for enabling notifications, handling loading and error states.
 * It uses Redux to dispatch actions related to notifications.
 *
 * @returns An object containing:
 * - `enableNotifications`: A function that triggers the enabling of notifications.
 * - `loading`: A boolean indicating if the enabling process is ongoing.
 * - `error`: A string or null value representing any error that occurred during the process.
 */
export function useEnableNotifications(): {
  enableNotifications: () => Promise<void>;
  error: string | null;
} {
  const dispatch = useDispatch();

  const [error, setError] = useState<string | null>(null);

  const enableNotifications = useCallback(async () => {
    setError(null);

    try {
      await dispatch(enableMetamaskNotifications());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      log.error(e);
      throw e;
    }
  }, [dispatch]);

  return {
    enableNotifications,
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
  error: string | null;
} {
  const dispatch = useDispatch();

  const [error, setError] = useState<string | null>(null);

  const disableNotifications = useCallback(async () => {
    setError(null);

    try {
      await dispatch(disableMetamaskNotifications());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      log.error(e);
      throw e;
    }
  }, [dispatch]);

  return {
    disableNotifications,
    error,
  };
}

/**
 * Provides a function to mark notifications as read. This hook does not take parameters itself,
 * but returns a function that accepts the notification parameters when called.
 *
 * @returns An object containing the `markNotificationAsRead` function which takes a `notifications`
 * parameter of type `MarkAsReadNotificationsParam` and marks those notifications as read.
 */
export function useMarkNotificationAsRead(): {
  markNotificationAsRead: (
    notifications: MarkAsReadNotificationsParam,
  ) => Promise<void>;
} {
  const dispatch = useDispatch();

  const markNotificationAsRead = useCallback(
    async (notifications: MarkAsReadNotificationsParam) => {
      try {
        dispatch(markMetamaskNotificationsAsRead(notifications));
      } catch (e) {
        log.error(e);
        throw e;
      }
    },
    [dispatch],
  );

  return {
    markNotificationAsRead,
  };
}
