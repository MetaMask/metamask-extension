function getValues(pendingApproval, t, actions, _history) {
  const { id, requestState } = pendingApproval;
  return {
    content: [
      {
        element: 'SmartTransactionStatusPage',
        key: 'smart-transaction-status-page',
        props: {
          requestState,
        },
      },
    ],
    submitText: t('ok'),
    // TODO: Once "onSubmit" is trully optional and we don't render the default confirmation footer section,
    // then we will implement our own custom buttons for the STX status page. Code below is only temporary.
    onSubmit: () => {
      const isSmartTransactionPending =
        requestState?.smartTransaction?.status === 'pending';
      if (!isSmartTransactionPending) {
        actions.resolvePendingApproval(id, true);
      }
    },
  };
}

const smartTransactionStatusPage = {
  getValues,
};

export default smartTransactionStatusPage;
