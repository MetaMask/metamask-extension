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

  const properties = {
    confirmation_type: pendingApprovals[0].type,
    referrer: pendingApprovals[0].origin,
    queue_size: queuedRequestCount,
    queue_type: queueType,
  };

  useEffect(() => {
    if (queuedRequestCount > 0) {
      trackEvent({
        event: MetaMetricsEventName.ConfirmationQueued,
        category: MetaMetricsEventCategory.Confirmations,
        properties,
      });
    }
  }, [JSON.stringify(properties), queuedRequestCount]);
};
