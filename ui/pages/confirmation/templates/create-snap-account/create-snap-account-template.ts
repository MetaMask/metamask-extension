// Import whatever you need to support your logic

function getValues(pendingApproval: any, actions: any) {
  return {
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
