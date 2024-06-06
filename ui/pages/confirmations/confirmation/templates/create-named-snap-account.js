import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';

function getValues(pendingApproval, t, actions, _history, _data, contexts) {
  const { origin: snapId, snapName, requestData } = pendingApproval;
  const { snapSuggestedAccountName } = requestData;
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

  const onActionComplete = (success) => {
    if (success) {
      trackSnapAccountEvent(MetaMetricsEventName.AddSnapAccountConfirmed);
      actions.resolvePendingApproval(pendingApproval.id, true);
    } else {
      trackSnapAccountEvent(MetaMetricsEventName.AddSnapAccountCanceled);
      actions.resolvePendingApproval(pendingApproval.id, false);
    }
  };

  return {
    content: [
      {
        element: 'CreateNamedSnapAccount',
        key: 'create-named-snap-account',
        props: {
          snapSuggestedAccountName,
          onActionComplete,
        },
      },
    ],
    hideSubmitButton: true,
    onLoad: () =>
      trackSnapAccountEvent(MetaMetricsEventName.AddSnapAccountViewed),
  };
}

const createNamedSnapAccount = {
  getValues,
};

export default createNamedSnapAccount;
