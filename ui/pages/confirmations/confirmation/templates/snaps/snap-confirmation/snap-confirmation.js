function getValues(pendingApproval, t, actions) {
  const {
    origin,
    requestData: { id },
  } = pendingApproval;

  return {
    content: [
      {
        element: 'Box',
        key: 'snap-dialog-content-wrapper',
        props: {
          marginTop: 4,
          marginLeft: 4,
          marginRight: 4,
        },
        children: {
          element: 'SnapUIRenderer',
          key: 'snap-ui-renderer',
          props: {
            snapId: origin,
            interfaceId: id,
          },
        },
      },
    ],
    cancelText: t('reject'),
    submitText: t('approveButtonText'),
    onSubmit: () => actions.resolvePendingApproval(pendingApproval.id, true),
    onCancel: () => actions.resolvePendingApproval(pendingApproval.id, false),
  };
}

const snapConfirmation = {
  getValues,
};

export default snapConfirmation;
