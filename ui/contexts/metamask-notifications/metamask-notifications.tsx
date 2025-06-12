import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  useDisableNotifications,
  useListNotifications,
} from '../../hooks/metamask-notifications/useNotifications';
import { selectIsMetamaskNotificationsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';
import { getUseExternalServices } from '../../selectors';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import { type Notification } from '../../pages/notifications/notification-components/types/notifications/notifications';
import { selectIsSignedIn } from '../../selectors/identity/authentication';

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

export const MetamaskNotificationsProvider: React.FC = ({ children }) => {
  const isNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const isUnlocked = useSelector(getIsUnlocked);
  const isSignedIn = useSelector(selectIsSignedIn);

  const { listNotifications, notificationsData, isLoading, error } =
    useListNotifications();
  const { disableNotifications } = useDisableNotifications();

  // Basic functionality effect
  useEffect(() => {
    if (!isBasicFunctionalityEnabled && isNotificationsEnabled) {
      // Disable notifications
      disableNotifications();
      // list notifications to reset the counter
      listNotifications();
    }
  }, [
    isBasicFunctionalityEnabled,
    isNotificationsEnabled,
    disableNotifications,
    listNotifications,
  ]);

  const shouldFetchNotifications = useMemo(
    () => isNotificationsEnabled && isSignedIn,
    [isNotificationsEnabled, isSignedIn],
  );

  useEffect(() => {
    if (isBasicFunctionalityEnabled && shouldFetchNotifications && isUnlocked) {
      listNotifications();
    }
  }, [
    shouldFetchNotifications,
    listNotifications,
    isBasicFunctionalityEnabled,
    isUnlocked,
  ]);

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
