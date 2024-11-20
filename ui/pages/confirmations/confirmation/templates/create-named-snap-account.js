import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';

/**
 * Returns the templated values to be consumed in the confirmation page.
 *
 * @param {object} pendingApproval - The pending confirmation object.
 * @param {Function} t - Translation function.
 * @param {object} actions - Object containing safe actions that the template can invoke.
 * @param {object} _history - The application's history object (not used in this function).
 * @param {object} _data - The data object passed into the template from the confirmation page (not
 *   used in this function).
 * @param {object} contexts - Context objects passed into the template from the confirmation page.
 * @returns {object} An object containing templated values for the confirmation page.
 */
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

  const onActionComplete = async (result) => {
    if (result.success) {
      trackSnapAccountEvent(MetaMetricsEventName.AddSnapAccountConfirmed);
      actions.resolvePendingApproval(pendingApproval.id, result);
    } else {
      trackSnapAccountEvent(MetaMetricsEventName.AddSnapAccountCanceled);
      // ! Resolve the pending approval to indicate that the user has canceled the flow. We do not
      // ! reject the approval but resolve with `false` for `SnapKeyring` to handle cancellation.
      actions.resolvePendingApproval(pendingApproval.id, false);
    }
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
    loadingText: t('addingAccount'),
    hideSubmitButton: true,
    onLoad: () =>
      trackSnapAccountEvent(MetaMetricsEventName.AddSnapAccountViewed),
  };
}

const createNamedSnapAccount = {
  getValues,
};

export default createNamedSnapAccount;
