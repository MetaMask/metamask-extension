import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../../../shared/constants/metametrics';

function getValues(pendingApproval, t, actions, _navigate, _data, contexts) {
  const { origin: snapId, snapName } = pendingApproval;
  const { trackEvent, createEventBuilder } = contexts;

  const trackSnapAccountEvent = (event) => {
    trackEvent(
      createEventBuilder(event)
        .addCategory(MetaMetricsEventCategory.Accounts)
        .addProperties({
          account_type: MetaMetricsEventAccountType.Snap,
          snap_id: snapId,
          snap_name: snapName,
        })
        .build(),
    );
  };

  const onCancel = () => {
    trackSnapAccountEvent(MetaMetricsEventName.AddSnapAccountCanceled);
    actions.resolvePendingApproval(pendingApproval.id, false);
  };

  return {
    content: [
      {
        element: 'CreateSnapAccount',
        key: 'create-snap-account',
        props: {
          snapId,
          snapName,
          onCancel,
        },
      },
    ],
    cancelText: t('cancel'),
    submitText: t('create'),
    onLoad: () =>
      trackSnapAccountEvent(MetaMetricsEventName.AddSnapAccountViewed),
    onSubmit: () => {
      trackSnapAccountEvent(MetaMetricsEventName.AddSnapAccountConfirmed);
      actions.resolvePendingApproval(pendingApproval.id, true);
    },
    onCancel,
  };
}

const createSnapAccount = {
  getValues,
};

export default createSnapAccount;
