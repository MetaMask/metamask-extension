import { mapToTemplate } from '../../../../../components/app/flask/snap-ui-renderer';

function getValues(pendingApproval, t, actions) {
  const {
    snapName,
    requestData: { content },
  } = pendingApproval;

  return {
    content: [
      {
        element: 'Box',
        key: 'snap-dialog-content-wrapper',
        props: {
          marginLeft: 4,
          marginRight: 4,
        },
        children: {
          element: 'SnapDelineator',
          key: 'snap-delineator',
          props: {
            snapName,
          },
          children: mapToTemplate(content),
        },
      },
    ],
    submitText: t('ok'),
    onSubmit: () => actions.resolvePendingApproval(pendingApproval.id, null),
  };
}

const snapAlert = {
  getValues,
};

export default snapAlert;
