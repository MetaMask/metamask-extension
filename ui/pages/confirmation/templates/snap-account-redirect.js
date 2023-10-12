function getValues(pendingApproval, t, actions, _history) {
  const { snapName } = pendingApproval;
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

  return {
    content: [
      {
        element: 'SnapAccountRedirect',
        key: 'snap-account-redirect',
        props: {
          url,
          message,
          snapName,
          isBlockedUrl,
        },
      },
    ],
    cancelText: t('close'),
    onCancel: () => actions.resolvePendingApproval(pendingApproval.id, false),
    ...getConditionalProps(),
  };
}

const createSnapAccount = {
  getValues,
};

export default createSnapAccount;
