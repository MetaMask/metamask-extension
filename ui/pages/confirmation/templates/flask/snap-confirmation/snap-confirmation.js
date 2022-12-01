import { TYPOGRAPHY } from '../../../../../helpers/constants/design-system';

function getValues(pendingApproval, t, actions) {
  const { snapName, requestData } = pendingApproval;
  const { title, description, textAreaContent } = requestData;

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
          children: [
            {
              element: 'Typography',
              key: 'title',
              children: title,
              props: {
                variant: TYPOGRAPHY.H3,
                fontWeight: 'bold',
                boxProps: {
                  marginBottom: 4,
                },
              },
            },
            ...(description
              ? [
                  {
                    element: 'Typography',
                    key: 'subtitle',
                    children: description,
                    props: {
                      variant: TYPOGRAPHY.H6,
                      boxProps: {
                        marginBottom: 4,
                      },
                    },
                  },
                ]
              : []),
            ...(textAreaContent
              ? [
                  {
                    element: 'Copyable',
                    key: 'snap-dialog-content-text',
                    props: {
                      text: textAreaContent,
                    },
                  },
                ]
              : []),
          ],
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
