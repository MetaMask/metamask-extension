// Import whatever you need to support your logic

function getValues(pendingApproval: any, t: any, actions: any) {
  console.log(
    'SNAPS/ create-snap-account-template.ts: getValues called with:',
    pendingApproval,
    t,
    actions,
  );

  return {
    content: [
      {
        element: 'Box',
        key: 'create-snap-account-content-wrapper',
      },
    ],
    cancelText: t('cancel'),
    submitText: t('create'),
    onSubmit: (accountName: string) => {
      actions.resolvePendingApproval(pendingApproval.id, {
        confirmed: true,
        accountName,
      });
    },
    onCancel: () =>
      actions.resolvePendingApproval(pendingApproval.id, { confirmed: false }),
  };
}

const createSnapAccountTemplate = {
  getValues,
};

export default createSnapAccountTemplate;
