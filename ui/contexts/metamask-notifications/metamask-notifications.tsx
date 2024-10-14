import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useListNotifications } from '../../hooks/metamask-notifications/useNotifications';
import { useAccountSyncingEffect } from '../../hooks/metamask-notifications/useProfileSyncing';
import { selectIsProfileSyncingEnabled } from '../../selectors/metamask-notifications/profile-syncing';
import { selectIsMetamaskNotificationsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';
import { getUseExternalServices } from '../../selectors';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import { type Notification } from '../../pages/notifications/notification-components/types/notifications/notifications';

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
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);
  const isNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const basicFunctionality = useSelector(getUseExternalServices);
  const isUnlocked = useSelector(getIsUnlocked);
  const { listNotifications, notificationsData, isLoading, error } =
    useListNotifications();

  const shouldFetchNotifications = useMemo(
    () => isProfileSyncingEnabled && isNotificationsEnabled,
    [isProfileSyncingEnabled, isNotificationsEnabled],
  );

  useAccountSyncingEffect();

  useEffect(() => {
    if (basicFunctionality && shouldFetchNotifications && isUnlocked) {
      listNotifications();
    }
  }, [
    shouldFetchNotifications,
    listNotifications,
    basicFunctionality,
    isUnlocked,
  ]);

  return (
    <MetamaskNotificationsContext.Provider
      value={{ listNotifications, notificationsData, isLoading, error }}
    >
      {children}
    </MetamaskNotificationsContext.Provider>
  );
};
