import { mapToTemplate } from '../../../../../components/app/snaps/snap-ui-renderer';
import { DelineatorType } from '../../../../../helpers/constants/snaps';

function getValues(pendingApproval, t, actions) {
  const {
    snapName,
    requestData: { content },
  } = pendingApproval;
  const elementKeyIndex = { value: 0 };

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
          element: 'SnapDelineator',
          key: 'snap-delineator',
          props: {
            type: DelineatorType.Content,
            snapName,
          },
          // TODO: Replace with SnapUIRenderer when we don't need to inject the input manually.
          children: {
            element: 'Box',
            key: 'snap-ui-content',
            children: mapToTemplate(content, elementKeyIndex),
            props: {
              className: 'snap-ui-renderer__content',
            },
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
