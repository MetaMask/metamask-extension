import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../../../shared/constants/metametrics';

function getValues(pendingApproval, t, actions, _history, _data, contexts) {
  const { origin: snapId, snapName } = pendingApproval;
  const { publicAddress } = pendingApproval.requestData;
  const { trackEvent } = contexts;

  const trackSnapAccountEvent = (event) => {
    trackEvent({
      event,
      category: MetaMetricsEventCategory.Accounts,
      properties: {
        account_type: MetaMetricsEventAccountType.Snap,
        snap_id: snapId,
        snap_name: snapName,
      },
    });
  };

  return {
    content: [
      {
        element: 'RemoveSnapAccount',
        key: 'remove-snap-account',
        props: {
          snapId,
          snapName,
          publicAddress,
        },
      },
    ],
    cancelText: t('cancel'),
    submitText: t('remove'),
    onLoad: () =>
      trackSnapAccountEvent(MetaMetricsEventName.RemoveSnapAccountViewed),
    onSubmit: () => {
      trackSnapAccountEvent(MetaMetricsEventName.RemoveSnapAccountConfirmed);
      actions.resolvePendingApproval(pendingApproval.id, true);
    },
    onCancel: () => {
      trackSnapAccountEvent(MetaMetricsEventName.RemoveSnapAccountCanceled);
      actions.resolvePendingApproval(pendingApproval.id, false);
    },
  };
}

const removeSnapAccount = {
  getValues,
};

export default removeSnapAccount;
