import React, { useSyncExternalStore } from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
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

const getServerSnapshot = () => true;

export const OfflineBanner = () => {
  const t = useI18nContext();
  const isOnline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <Box role="status">
      {!isOnline && (
        <BannerAlert severity={BannerAlertSeverity.Warning}>
          {t('offlineBanner')}
        </BannerAlert>
      )}
    </Box>
  );
};
