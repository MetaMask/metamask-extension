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
  const { account, snapSuggestedAccountName } = requestData;
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

  const onActionComplete = async (success) => {
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
          onActionComplete,
          account,
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
