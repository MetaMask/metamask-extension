import React, { useContext, useEffect } from 'react';
import { InternalAccount } from '@metamask/keyring-api';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../shared/constants/metametrics';

const SnapAccountTransactionLoadingScreen = ({
  internalAccount,
}: {
  internalAccount: InternalAccount;
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.SnapAccountTransactionLoadingViewed,
      category: MetaMetricsEventCategory.Transactions,
      properties: {
        snap_id: internalAccount?.metadata.snap?.id,
        snap_name: internalAccount?.metadata.snap?.name,
        account_type: MetaMetricsEventAccountType.Snap,
      },
    });
  }, []);

  return <span>{t('loadingScreenSnapMessage')}</span>;
};

export default SnapAccountTransactionLoadingScreen;
