// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { useSelector } from 'react-redux';
import { QueueType } from '../../../../../../shared/constants/metametrics';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getQueuedRequestCount } from '../../../../../selectors';
import { useQueuedConfirmationsEvent } from '../../../hooks/useQueuedConfirmationEvents';

export const QueuedRequestsBannerAlert = () => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();

  const queuedRequestCount = useSelector(getQueuedRequestCount);

  useQueuedConfirmationsEvent(QueueType.QueueController);

  if (queuedRequestCount === 0) {
    return null;
  }

  return (
    <BannerAlert
      severity={BannerAlertSeverity.Info}
      description={t('existingRequestsBannerAlertDesc')}
      margin={4}
    />
  );
};
