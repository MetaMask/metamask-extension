import React, { useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../../../../components/component-library';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getQueuedRequestCount,
  pendingConfirmationsSortedSelector,
} from '../../../../../selectors';

export const ExistingRequestsBannerAlert = () => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const [metricsSent, setMetricsSent] = useState(false);

  const queuedRequestCount = useSelector(getQueuedRequestCount);
  const showExistingRequestBannerAlert = queuedRequestCount > 0;

  const pendingConfirmations = useSelector(pendingConfirmationsSortedSelector);

  if (showExistingRequestBannerAlert && !metricsSent) {
    trackEvent({
      event: MetaMetricsEventName.ConfirmationQueued,
      category: MetaMetricsEventCategory.Confirmations,
      properties: {
        confirmation_type: pendingConfirmations[0].type,
        referrer: pendingConfirmations[0].origin,
        queue_size: queuedRequestCount,
        queue_type: 'queue_controller',
      },
    });

    setMetricsSent(true);
  }

  return showExistingRequestBannerAlert ? (
    <BannerAlert
      severity={BannerAlertSeverity.Info}
      description={t('existingRequestsBannerAlertDesc')}
      margin={4}
    />
  ) : null;
};
