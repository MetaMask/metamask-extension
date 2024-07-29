function getValues(pendingApproval, actions) {
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
