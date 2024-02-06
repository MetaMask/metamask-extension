function getValues(pendingApproval, t, actions, _history) {
  return {
    cancelText: t('cancel'),
    submitText: t('submit'),
    onSubmit: (inputValue) =>
      actions.resolvePendingApproval(pendingApproval.id, inputValue),
    onCancel: () => actions.resolvePendingApproval(pendingApproval.id, null),
  };
}

const snapConfirm = {
  getValues,
};

export default snapConfirm;
