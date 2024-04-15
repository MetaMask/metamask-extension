import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../../../shared/constants/metametrics';

function getValues(pendingApproval, t, actions, _history, _data, contexts) {
  const { origin: snapId, snapName } = pendingApproval;
  const { url, message, isBlockedUrl } = pendingApproval.requestData;
  const { trackEvent } = contexts;

  const trackSnapAccountEvent = (event) => {
    trackEvent({
      event,
      category: MetaMetricsEventCategory.Transactions,
      properties: {
        account_type: MetaMetricsEventAccountType.Snap,
        snap_id: snapId,
        snap_name: snapName,
      },
    });
  };

  const hasValidNonBlockedUrl = () => {
    return (
      url !== undefined &&
      url !== null &&
      url.length > 0 &&
      isBlockedUrl === false
    );
  };

  // We can only submit if the URL is valid and non-blocked
  const onSubmit = (event) => {
    return hasValidNonBlockedUrl()
      ? {
          submitText: t('goToSite'),
          onSubmit: () => {
            trackSnapAccountEvent(event);
            actions.resolvePendingApproval(pendingApproval.id, true);
          },
        }
      : {};
  };

  return {
    content: [
      {
        element: 'SnapAccountRedirect',
        key: 'snap-account-redirect',
        props: {
          url,
          message,
          snapId,
          snapName,
          isBlockedUrl,
          ...onSubmit(
            MetaMetricsEventName.SnapAccountTransactionFinalizeRedirectSnapUrlClicked,
          ),
        },
      },
    ],
    cancelText: t('close'),
    onLoad: () =>
      trackSnapAccountEvent(
        MetaMetricsEventName.SnapAccountTransactionFinalizeViewed,
      ),
    onCancel: () => {
      trackSnapAccountEvent(
        MetaMetricsEventName.SnapAccountTransactionFinalizeClosed,
      );
      actions.resolvePendingApproval(pendingApproval.id, false);
    },
    ...onSubmit(
      MetaMetricsEventName.SnapAccountTransactionFinalizeRedirectGoToSiteClicked,
    ),
  };
}

const createSnapAccount = {
  getValues,
};

export default createSnapAccount;
