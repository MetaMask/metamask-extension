import { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type {
  QueueType} from '../../../../shared/constants/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName
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

      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
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
