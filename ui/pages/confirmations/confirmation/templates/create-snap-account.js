function getValues(pendingApproval, t, actions, _history) {
  const { origin: snapId, snapName } = pendingApproval;

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
    onSubmit: () => actions.resolvePendingApproval(pendingApproval.id, true),
    onCancel: () => actions.resolvePendingApproval(pendingApproval.id, false),
  };
}

const createSnapAccount = {
  getValues,
};

export default createSnapAccount;
