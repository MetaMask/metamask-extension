import React from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export function UntrustedSenderBanner() {
  const t = useI18nContext();

  return (
    <BannerAlert
      severity={BannerAlertSeverity.Warning}
      data-testid="activity-untrusted-sender-banner"
      description={t('activityUntrustedSenderWarning')}
    />
  );
}
