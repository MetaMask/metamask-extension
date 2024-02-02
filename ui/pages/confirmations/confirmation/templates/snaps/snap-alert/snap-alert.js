function getValues(pendingApproval, t, actions) {
  return {
    submitText: t('ok').toUpperCase(),
    onSubmit: () => actions.resolvePendingApproval(pendingApproval.id, null),
  };
}

const snapAlert = {
  getValues,
};

export default snapAlert;
