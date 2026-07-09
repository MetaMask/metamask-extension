import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../../../shared/constants/metametrics';

function getValues(pendingApproval, t, actions, _navigate, _data, contexts) {
  const { origin: snapId, snapName } = pendingApproval;
  const { publicAddress } = pendingApproval.requestData;
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
    trackSnapAccountEvent(MetaMetricsEventName.RemoveSnapAccountCanceled);
    actions.resolvePendingApproval(pendingApproval.id, false);
  };

  return {
    content: [
      {
        element: 'RemoveSnapAccount',
        key: 'remove-snap-account',
        props: {
          snapId,
          publicAddress,
          onCancel,
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
    onCancel,
  };
}

const removeSnapAccount = {
  getValues,
};

export default removeSnapAccount;
