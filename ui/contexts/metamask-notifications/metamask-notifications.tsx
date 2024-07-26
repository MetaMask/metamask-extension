import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { useListNotifications } from '../../hooks/metamask-notifications/useNotifications';
import { selectIsProfileSyncingEnabled } from '../../selectors/metamask-notifications/profile-syncing';
import { selectIsNotificationServicesEnabled } from '../../selectors/metamask-notifications/metamask-notifications';
import { getUseExternalServices } from '../../selectors';

type MetamaskNotificationsContextType = {
  listNotifications: () => void;
  notificationsData?: NotificationServicesController.Types.INotification[];
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
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);
  const isNotificationsEnabled = useSelector(
    selectIsNotificationServicesEnabled,
  );
  const basicFunctionality = useSelector(getUseExternalServices);

  const { listNotifications, notificationsData, isLoading, error } =
    useListNotifications();

  const shouldFetchNotifications = useMemo(
    () => isProfileSyncingEnabled && isNotificationsEnabled,
    [isProfileSyncingEnabled, isNotificationsEnabled],
  );

  useEffect(() => {
    if (basicFunctionality && shouldFetchNotifications) {
      listNotifications();
    }
  }, [shouldFetchNotifications, listNotifications, basicFunctionality]);

  return (
    <MetamaskNotificationsContext.Provider
      value={{ listNotifications, notificationsData, isLoading, error }}
    >
      {children}
    </MetamaskNotificationsContext.Provider>
  );
};
