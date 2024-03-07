function getValues(pendingApproval, t, actions) {
  const {
    requestData: { id },
  } = pendingApproval;
  return {
    cancelText: t('reject'),
    submitText: t('approveButtonText'),
    onSubmit: () => {
      actions.resolvePendingApproval(pendingApproval.id, true);
      actions.deleteInterface(id);
    },
    onCancel: () => {
      actions.resolvePendingApproval(pendingApproval.id, false);
      actions.deleteInterface(id);
    },
  };
}

const snapConfirmation = {
  getValues,
};

export default snapConfirmation;
