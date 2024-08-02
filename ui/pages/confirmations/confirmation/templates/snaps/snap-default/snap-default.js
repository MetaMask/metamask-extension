function getValues(pendingApproval, _t, actions) {
  const {
    requestData: { id },
  } = pendingApproval;
  return {
    onCancel: () => {
      actions.resolvePendingApproval(pendingApproval.id, null);
      actions.deleteInterface(id);
    },
  };
}

const snapDefault = {
  getValues,
};

export default snapDefault;
