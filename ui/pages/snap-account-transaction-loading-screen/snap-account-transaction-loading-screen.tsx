import React, { useContext, useEffect } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../shared/constants/metametrics';
import { getSnapsMetadata } from '../../selectors';
import { getSnapName } from '../../helpers/utils/util';

const SnapAccountTransactionLoadingScreen = ({
  internalAccount,
}: {
  internalAccount: InternalAccount;
}) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const snapsMetadata = useSelector(getSnapsMetadata);
  const snapId = internalAccount?.metadata.snap?.id;
  const snapName = snapId ? getSnapName(snapsMetadata)(snapId) : undefined;

  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.SnapAccountTransactionLoadingViewed,
      category: MetaMetricsEventCategory.Transactions,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        snap_id: snapId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        snap_name: snapName,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: MetaMetricsEventAccountType.Snap,
      },
    });
  }, []);

  return <span>{t('loadingScreenSnapMessage')}</span>;
};

export default SnapAccountTransactionLoadingScreen;
