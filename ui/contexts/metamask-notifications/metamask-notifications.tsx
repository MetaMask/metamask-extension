import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { useSelector } from 'react-redux';
import {
  useDisableNotifications,
  useEnableNotifications,
  useListNotifications,
} from '../../hooks/metamask-notifications/useNotifications';
import {
  getIsNotificationEnabledByDefaultFeatureFlag,
  selectIsMetamaskNotificationsEnabled,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { getUseExternalServices } from '../../selectors';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import { type Notification } from '../../pages/notifications/notification-components/types/notifications/notifications';
import { selectIsSignedIn } from '../../selectors/identity/authentication';
import {
  hasNotificationSubscriptionExpired,
  hasUserTurnedOffNotificationsOnce,
} from './notification-storage-keys';

type MetamaskNotificationsContextType = {
  listNotifications: () => void;
  notificationsData?: Notification[];
  isLoading: boolean;
  error?: unknown;
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

const useDisableAndRefresh = () => {
  const { disableNotifications } = useDisableNotifications();
  const { listNotifications } = useListNotifications();
  return useCallback(async () => {
    await disableNotifications();
    await listNotifications();
  }, [disableNotifications, listNotifications]);
};

const useEnableAndRefresh = () => {
  const { enableNotifications } = useEnableNotifications();
  const { listNotifications } = useListNotifications();
  return useCallback(
    async (shouldEnable = true) => {
      shouldEnable && (await enableNotifications());
      await listNotifications();
    },
    [enableNotifications, listNotifications],
  );
};

export function useBasicFunctionalityDisableEffect() {
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const isNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const disableAndRefresh = useDisableAndRefresh();

  useEffect(() => {
    const run = async () => {
      try {
        if (!isBasicFunctionalityEnabled && isNotificationsEnabled) {
          await disableAndRefresh();
        }
      } catch {
        // Do nothing
      }
    };
    run();
  }, [disableAndRefresh, isBasicFunctionalityEnabled, isNotificationsEnabled]);
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
  const enableAndRefresh = useEnableAndRefresh();

  useEffect(() => {
    const run = async () => {
      try {
        if (
          isBasicFunctionalityEnabled &&
          shouldFetchNotifications &&
          isUnlocked
        ) {
          await enableAndRefresh(await hasNotificationSubscriptionExpired());
        }
      } catch {
        // Do nothing
      }
    };
    run();
  }, [
    shouldFetchNotifications,
    isBasicFunctionalityEnabled,
    isUnlocked,
    enableAndRefresh,
  ]);
}

export function useEnableNotificationsByDefaultEffect() {
  const isNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const isUnlocked = useSelector(getIsUnlocked);
  const isNotificationsEnabledByDefaultFeatureFlag = useSelector(
    getIsNotificationEnabledByDefaultFeatureFlag,
  );
  const enableAndRefresh = useEnableAndRefresh();

  useEffect(() => {
    const run = async () => {
      try {
        if (
          !isNotificationsEnabled &&
          isBasicFunctionalityEnabled &&
          isUnlocked &&
          isNotificationsEnabledByDefaultFeatureFlag
        ) {
          if (!(await hasUserTurnedOffNotificationsOnce())) {
            await enableAndRefresh();
          }
        }
      } catch {
        // Do nothing
      }
    };
    run();
  }, [
    enableAndRefresh,
    isBasicFunctionalityEnabled,
    isNotificationsEnabled,
    isNotificationsEnabledByDefaultFeatureFlag,
    isUnlocked,
  ]);
}

export const MetamaskNotificationsProvider: React.FC = ({ children }) => {
  const { listNotifications, notificationsData, isLoading, error } =
    useListNotifications();

  // Basic functionality effect
  useBasicFunctionalityDisableEffect();

  // Update subscriptions and fetch notifications
  useFetchInitialNotificationsEffect();

  // Enable notifications by default for users
  useEnableNotificationsByDefaultEffect();

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
