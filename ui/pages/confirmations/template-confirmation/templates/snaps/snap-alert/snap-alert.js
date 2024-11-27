function getValues(pendingApproval, t, actions) {
  const {
    requestData: { id },
  } = pendingApproval;
  return {
    submitText: t('ok').toUpperCase(),
    onSubmit: () => {
      actions.resolvePendingApproval(pendingApproval.id, null);
      actions.deleteInterface(id);
    },
  };
}

const snapAlert = {
  getValues,
};

export default snapAlert;
