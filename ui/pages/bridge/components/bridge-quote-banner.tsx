import React from 'react';
import { useSelector } from 'react-redux';
import { getActiveQuotePriceData } from '../../../ducks/bridge/selectors';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const BridgeQuoteBanner = () => {
  const t = useI18nContext();
  const activeQuotePriceData = useSelector(getActiveQuotePriceData);

  if (!activeQuotePriceData) {
    return (
      <BannerAlert
        severity={BannerAlertSeverity.Danger}
        description={t('bridgePriceDataUnavailableError')}
      />
    );
  }

  return null;
};
