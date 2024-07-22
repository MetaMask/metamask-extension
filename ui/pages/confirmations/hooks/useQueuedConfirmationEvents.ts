import { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  QueueType,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  getQueuedRequestCount,
  pendingApprovalsSortedSelector,
} from '../../../selectors';

export const useQueuedConfirmationsEvent = (queueType: QueueType) => {
  const pendingApprovals = useSelector(pendingApprovalsSortedSelector);
  const queuedRequestCount = useSelector(getQueuedRequestCount);
  const trackEvent = useContext(MetaMetricsContext);

  useEffect(() => {
    if (pendingApprovals.length > 0 && queuedRequestCount > 0) {
      const properties = {
        confirmation_type: pendingApprovals[0].type,
        referrer: pendingApprovals[0].origin,
        queue_size: queuedRequestCount,
        queue_type: queueType,
      };

      trackEvent({
        event: MetaMetricsEventName.ConfirmationQueued,
        category: MetaMetricsEventCategory.Confirmations,
        properties,
      });
    }
  }, [
    JSON.stringify(pendingApprovals),
    queuedRequestCount,
    queueType,
    trackEvent,
  ]);
};
