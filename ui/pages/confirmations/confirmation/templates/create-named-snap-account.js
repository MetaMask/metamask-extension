import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';

function getValues(pendingApproval, t, actions, _history, _data, contexts) {
  const { origin: snapId, snapName, requestData } = pendingApproval;
  const { onActionComplete, snapSuggestedAccountName } = requestData;
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
        element: 'CreateNamedSnapAccount',
        key: 'create-named-snap-account',
        props: {
          onActionComplete,
          snapSuggestedAccountName,
        },
      },
    ],
    cancelText: t('cancel'),
    submitText: t('Add account'),
    onLoad: () =>
      trackSnapAccountEvent(MetaMetricsEventName.AddSnapAccountViewed),
    onSubmit: () => {
      trackSnapAccountEvent(MetaMetricsEventName.AddSnapAccountConfirmed);
      actions.resolvePendingApproval(pendingApproval.id, true);
    },
    onCancel: () => {
      trackSnapAccountEvent(MetaMetricsEventName.AddSnapAccountCanceled);
      actions.resolvePendingApproval(pendingApproval.id, false);
    },
  };
}

const createSnapAccount = {
  getValues,
};

export default createSnapAccount;
