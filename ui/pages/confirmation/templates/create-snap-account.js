// Import whatever you need to support your logic

function getValues(pendingApproval, t, actions, _history, setInputState) {
  console.log(
    'SNAPS/ create-snap-account-template.ts: getValues called with:',
    pendingApproval,
    t,
    actions,
  );

  const { origin: snapId, snapName } = pendingApproval;

  return {
    content: [
      {
        element: 'CreateSnapAccount',
        key: 'create-snap-account',
        props: {
          snapId,
          snapName,
          onAccountNameChange: (accountName) => {
            setInputState('snap_manageAccounts:confirmation', accountName);
          },
        },
      },
    ],
    cancelText: t('cancel'),
    submitText: t('create'),
    onSubmit: (accountName) => {
      actions.resolvePendingApproval(pendingApproval.id, {
        confirmed: true,
        accountName,
      });
    },
    onCancel: () =>
      actions.resolvePendingApproval(pendingApproval.id, { confirmed: false }),
  };
}

const createSnapAccount = {
  getValues,
};

export default createSnapAccount;
