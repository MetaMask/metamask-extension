function getValues(pendingApproval, t, actions, _history) {
  const { origin: snapId, snapName } = pendingApproval;
  const { publicAddress } = pendingApproval.requestData;

  return {
    content: [
      {
        element: 'RemoveSnapAccount',
        key: 'remove-snap-account',
        props: {
          snapId,
          snapName,
          publicAddress,
        },
      },
    ],
    cancelText: t('cancel'),
    submitText: t('remove'),
    onSubmit: () => actions.resolvePendingApproval(pendingApproval.id, true),
    onCancel: () => actions.resolvePendingApproval(pendingApproval.id, false),
  };
}

const createSnapAccount = {
  getValues,
};

export default createSnapAccount;
