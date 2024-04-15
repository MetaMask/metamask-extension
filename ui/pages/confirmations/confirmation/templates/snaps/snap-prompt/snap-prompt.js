function getValues(pendingApproval, t, actions) {
  const {
    requestData: { id },
  } = pendingApproval;
  return {
    cancelText: t('cancel'),
    submitText: t('submit'),
    onSubmit: (inputValue) => {
      actions.resolvePendingApproval(pendingApproval.id, inputValue);
      actions.deleteInterface(id);
    },
    onCancel: () => {
      actions.resolvePendingApproval(pendingApproval.id, null);
      actions.deleteInterface(id);
    },
  };
}

const snapConfirm = {
  getValues,
};

export default snapConfirm;
