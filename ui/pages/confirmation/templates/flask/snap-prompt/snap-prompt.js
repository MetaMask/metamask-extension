import { TYPOGRAPHY } from '../../../../../helpers/constants/design-system';
import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';

function getValues(pendingApproval, t, actions, _history, setInputState) {
  const { snapName, requestData } = pendingApproval;
  const { title, description, placeholder } = requestData;

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
            {
              element: 'div',
              key: 'snap-prompt-container',
              children: {
                element: 'TextField',
                key: 'snap-prompt-input',
                props: {
                  className: 'snap-prompt-input',
                  placeholder,
                  max: 300,
                  onChange: (event) => {
                    const inputValue = event.target.value ?? '';
                    setInputState(MESSAGE_TYPE.SNAP_DIALOG_PROMPT, inputValue);
                  },
                  theme: 'bordered',
                },
              },
              props: {
                className: 'snap-prompt',
              },
            },
          ],
        },
      },
    ],
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
