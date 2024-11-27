// eslint-disable-next-line no-unused-vars
function getValues(pendingApproval, t, actions, _history) {
  const { id, requestState } = pendingApproval;
  return {
    content: [
      {
        element: 'SmartTransactionStatusPage',
        key: 'smart-transaction-status-page',
        props: {
          requestState,
          onCloseExtension: () => {
            actions.resolvePendingApproval(id, true);
          },
          onViewActivity: () => {
            actions.resolvePendingApproval(id, true);
          },
        },
      },
    ],
    hideSubmitButton: true,
  };
}

const smartTransactionStatusPage = {
  getValues,
};

export default smartTransactionStatusPage;
