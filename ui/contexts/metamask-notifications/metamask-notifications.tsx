import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getIsUnlocked } from '../../ducks/metamask/metamask';
import {
  useDisableNotifications,
  useListNotifications,
} from '../../hooks/metamask-notifications/useNotifications';
import { type Notification } from '../../pages/notifications/notification-components/types/notifications/notifications';
import { getUseExternalServices } from '../../selectors';
import { selectIsSignedIn } from '../../selectors/identity/authentication';
import { selectIsMetamaskNotificationsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';

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
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
      disableNotifications();
      // list notifications to reset the counter
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
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
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
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
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
      value={{ listNotifications, notificationsData, isLoading, error }}
    >
      {children}
    </MetamaskNotificationsContext.Provider>
  );
};
