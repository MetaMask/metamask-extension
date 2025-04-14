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
        // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        confirmation_type: pendingApprovals[0].type,
        referrer: pendingApprovals[0].origin,
        // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        queue_size: queuedRequestCount,
        // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
