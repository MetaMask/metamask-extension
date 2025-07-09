import React, { createContext, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  useDisableNotifications,
  useEnableNotifications,
  useListNotifications,
} from '../../hooks/metamask-notifications/useNotifications';
import { selectIsMetamaskNotificationsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';
import { getUseExternalServices } from '../../selectors';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import { type Notification } from '../../pages/notifications/notification-components/types/notifications/notifications';
import { selectIsSignedIn } from '../../selectors/identity/authentication';
import {
  getStorageItem,
  setStorageItem,
} from '../../../shared/lib/storage-helpers';

type MetamaskNotificationsContextType = {
  listNotifications: () => void;
  notificationsData?: Notification[];
  isLoading: boolean;
  error?: unknown;
};

const EXPIRY_KEY = 'RESUBSCRIBE_NOTIFICATIONS_EXPIRY';
const EXPIRY_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day

const hasExpired = async () => {
  const expiryTimestamp: string | undefined = await getStorageItem(EXPIRY_KEY);
  if (!expiryTimestamp) {
    return true;
  }
  const now = Date.now();
  return now > parseInt(expiryTimestamp, 10);
};

const setExpiry = async () => {
  const now = Date.now();
  const expiryTimestamp = now + EXPIRY_DURATION_MS;
  await setStorageItem(EXPIRY_KEY, expiryTimestamp.toString());
};

const MetamaskNotificationsContext = createContext<
  MetamaskNotificationsContextType | undefined
>(undefined);

export const useMetamaskNotificationsContext = () => {
  const context = useContext(MetamaskNotificationsContext);
  if (!context) {
    throw new Error(
      'useNotificationsContext must be used within a MetamaskNotificationsProvider',
    );
  }
  return context;
};

export function useBasicFunctionalityDisableEffect() {
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const isNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const { disableNotifications } = useDisableNotifications();
  const { listNotifications } = useListNotifications();

  useEffect(() => {
    const run = async () => {
      try {
        if (!isBasicFunctionalityEnabled && isNotificationsEnabled) {
          // disable notifications services
          await disableNotifications();
          // list notifications to reset the counter
          await listNotifications();
        }
      } catch {
        // Do nothing
      }
    };
    run();
  }, [
    disableNotifications,
    isBasicFunctionalityEnabled,
    isNotificationsEnabled,
    listNotifications,
  ]);
}

export function useFetchInitialNotificationsEffect() {
  const isNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const isUnlocked = useSelector(getIsUnlocked);
  const isSignedIn = useSelector(selectIsSignedIn);
  const shouldFetchNotifications =
    Boolean(isNotificationsEnabled) && Boolean(isSignedIn);
  const { enableNotifications } = useEnableNotifications();
  const { listNotifications } = useListNotifications();

  useEffect(() => {
    const run = async () => {
      try {
        if (
          isBasicFunctionalityEnabled &&
          shouldFetchNotifications &&
          isUnlocked
        ) {
          if (await hasExpired()) {
            // Re-enabling notifications as we need to ensure that the notification subscriptions are correctly setup
            await enableNotifications();
            await setExpiry();
          }
          // update list of notifications and notification counter
          await listNotifications();
        }
      } catch {
        // Do nothing
      }
    };
    run();
  }, [
    shouldFetchNotifications,
    listNotifications,
    isBasicFunctionalityEnabled,
    isUnlocked,
    enableNotifications,
  ]);
}

export const MetamaskNotificationsProvider: React.FC = ({ children }) => {
  const { listNotifications, notificationsData, isLoading, error } =
    useListNotifications();

  // Basic functionality effect
  useBasicFunctionalityDisableEffect();

  // Update subscriptions and fetch notifications
  useFetchInitialNotificationsEffect();

  return (
    <MetamaskNotificationsContext.Provider
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      value={{ listNotifications, notificationsData, isLoading, error }}
    >
      {children}
    </MetamaskNotificationsContext.Provider>
  );
};
