import React, { useSyncExternalStore } from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);

  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

const getSnapshot = () => navigator.onLine;

export const OfflineBanner = () => {
  const t = useI18nContext();
  const isOnline = useSyncExternalStore(subscribeToOnlineStatus, getSnapshot);

  return (
    <div role="status">
      {!isOnline && (
        <BannerAlert className="m-4" severity={BannerAlertSeverity.Warning}>
          {t('offlineBanner')}
        </BannerAlert>
      )}
    </div>
  );
};
