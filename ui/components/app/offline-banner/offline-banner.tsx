import React, { useSyncExternalStore } from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

const subscribe = (callback: () => void) => {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
};

const getSnapshot = () => navigator.onLine;

export const OfflineBanner = () => {
  const t = useI18nContext();
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);

  return (
    <div role="status">
      {!isOnline && (
        <BannerAlert severity={BannerAlertSeverity.Warning}>
          {t('offlineBanner')}
        </BannerAlert>
      )}
    </div>
  );
};
