import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../../../shared/constants/metametrics';

const eventInfo = {
  category: MetaMetricsEventCategory.Accounts,
  properties: {
    account_type: MetaMetricsEventAccountType.Snap,
    // TODO: Add more snap info
  },
};

function onCancel(pendingApproval, actions, trackEvent) {
  actions.resolvePendingApproval(pendingApproval.id, false);
  trackEvent({
    event: MetaMetricsEventName.AccountAddFailed,
    ...eventInfo,
  });
}

function onSubmit(pendingApproval, actions, trackEvent) {
  actions.resolvePendingApproval(pendingApproval.id, true);
  trackEvent({
    event: MetaMetricsEventName.AccountAdded,
    ...eventInfo,
  });
}

function getValues(pendingApproval, t, actions, _history, _data, contexts) {
  const { origin: snapId, snapName } = pendingApproval;
  const { trackEvent } = contexts;

  // Assuming that users will view this page once the template is created
  trackEvent({
    event: MetaMetricsEventName.AddSnapAccountViewed,
    ...eventInfo,
  });

  return {
    content: [
      {
        element: 'CreateSnapAccount',
        key: 'create-snap-account',
        props: {
          snapId,
          snapName,
        },
      },
    ],
    cancelText: t('cancel'),
    submitText: t('create'),
    onSubmit: () => onSubmit(pendingApproval, actions, trackEvent),
    onCancel: () => onCancel(pendingApproval, actions, trackEvent),
  };
}

const createSnapAccount = {
  getValues,
};

export default createSnapAccount;
