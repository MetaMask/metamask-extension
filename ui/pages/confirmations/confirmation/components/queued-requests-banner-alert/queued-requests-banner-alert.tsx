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
