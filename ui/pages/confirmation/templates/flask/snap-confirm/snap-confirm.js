import {
  RESIZE,
  TYPOGRAPHY,
} from '../../../../../helpers/constants/design-system';

function getValues(pendingApproval, t, actions) {
  const { prompt, description, textAreaContent } = pendingApproval.requestData;

  return {
    content: [
      {
        element: 'Typography',
        key: 'title',
        children: prompt,
        props: {
          variant: TYPOGRAPHY.H3,
          align: 'center',
          fontWeight: 'bold',
          boxProps: {
            margin: [0, 0, 4],
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
                align: 'center',
                boxProps: {
                  margin: [0, 0, 4],
                },
              },
            },
          ]
        : []),
      ...(textAreaContent
        ? [
            {
              element: 'div',
              key: 'text-area',
              children: {
                element: 'TextArea',
                props: {
                  // TODO(ritave): Terrible hard-coded height hack. Fixing this to adjust automatically to current window height would
                  //               mean allowing template compoments to change global css, and since the intended use of the template
                  //               renderer was to allow users to build their own UIs, this would be a big no-no.
                  height: '238px',
                  value: textAreaContent,
                  readOnly: true,
                  resize: RESIZE.VERTICAL,
                  scrollable: true,
                  className: 'text',
                },
              },
              props: {
                className: 'snap-confirm',
              },
            },
          ]
        : []),
      {
        element: 'Typography',
        key: 'only-interact-with-entities-you-trust',
        children: [
          {
            element: 'span',
            key: 'only-connect-trust',
            children: `${t('onlyConnectTrust')} `,
          },
          {
            element: 'a',
            children: t('learnMoreUpperCase'),
            key: 'learnMore-a-href',
            props: {
              href:
                'https://metamask.zendesk.com/hc/en-us/articles/4405506066331-User-guide-Dapps',
              target: '__blank',
            },
          },
        ],
        props: {
          variant: TYPOGRAPHY.H7,
          align: 'center',
          boxProps: {
            margin: 0,
          },
        },
      },
    ],
    approvalText: t('approveButtonText'),
    cancelText: t('reject'),
    onApprove: () => actions.resolvePendingApproval(pendingApproval.id, true),
    onCancel: () => actions.resolvePendingApproval(pendingApproval.id, false),
  };
}

const snapConfirm = {
  getValues,
};

export default snapConfirm;
