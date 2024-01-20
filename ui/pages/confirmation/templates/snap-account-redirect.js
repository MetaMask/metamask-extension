function getValues(pendingApproval, t, actions, _history) {
  const { origin: snapId, snapName } = pendingApproval;
  const { url, message, isBlockedUrl } = pendingApproval.requestData;

  const getConditionalProps = () => {
    if (
      url !== undefined &&
      url !== null &&
      url.length > 0 &&
      isBlockedUrl === false
    ) {
      return {
        submitText: t('goToSite'),
        onSubmit: () =>
          actions.resolvePendingApproval(pendingApproval.id, true),
      };
    }
    return {};
  };

  const conditionalProps = getConditionalProps();

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
          ...conditionalProps,
        },
      },
    ],
    cancelText: t('close'),
    onCancel: () => actions.resolvePendingApproval(pendingApproval.id, false),
    ...conditionalProps,
  };
}

const createSnapAccount = {
  getValues,
};

export default createSnapAccount;
