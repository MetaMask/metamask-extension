// eslint-disable-next-line no-unused-vars
function getValues(pendingApproval, t, actions, _navigate) {
  const { id, requestState } = pendingApproval;
  return {
    // Immediately resolve the approval so the user is sent home instead of
    // seeing the full-screen status page.  The transaction keeps processing
    // in the background and the toast listener provides status feedback.
    onLoad: () => {
      actions.resolvePendingApproval(id, true);
    },
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
