import type { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useContext, useEffect } from 'react';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { useI18nContext } from '../../hooks/useI18nContext';

const SnapAccountTransactionLoadingScreen = ({
  internalAccount,
}: {
  internalAccount: InternalAccount;
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
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
