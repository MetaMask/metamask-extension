// Import whatever you need to support your logic

function getValues(pendingApproval: any, actions: any) {
  return {
    onSubmit: (accountName: string) => {
      console.log(
        'SNAPS/ create-snap-account-template.ts: onSubmit called with:',
        accountName,
      );
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
