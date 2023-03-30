import { TypographyVariant } from '../../../../../helpers/constants/design-system';
import { mapToTemplate } from '../../../../../components/app/flask/snap-ui-renderer';
import { DelineatorType } from '../../../../../helpers/constants/flask';

function getValues(pendingApproval, t, actions) {
  const {
    snapName,
    requestData: { content, title, description, textAreaContent },
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
            type: DelineatorType.content,
            snapName,
          },
          // TODO: Replace with SnapUIRenderer when we don't need to inject the input manually.
          // TODO: Remove ternary once snap_confirm has been removed.
          children: content
            ? mapToTemplate(content)
            : [
                {
                  element: 'Typography',
                  key: 'title',
                  children: title,
                  props: {
                    variant: TypographyVariant.H3,
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
                          variant: TypographyVariant.H6,
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
