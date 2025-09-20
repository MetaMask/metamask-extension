import React, { useContext, useEffect } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
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
  const { trackEvent } = useContext(MetaMetricsContext);

  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.SnapAccountTransactionLoadingViewed,
      category: MetaMetricsEventCategory.Transactions,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        snap_id: internalAccount?.metadata.snap?.id,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        snap_name: internalAccount?.metadata.snap?.name,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: MetaMetricsEventAccountType.Snap,
      },
    });
  }, []);

  return <span>{t('loadingScreenSnapMessage')}</span>;
};

export default SnapAccountTransactionLoadingScreen;
