import {
  RESIZE,
  TYPOGRAPHY,
} from '../../../../../helpers/constants/design-system';

function getValues(pendingApproval, t, actions) {
  return {
    content: [
      {
        element: 'Typography',
        key: 'title',
        children: pendingApproval.requestData.title,
        props: {
          variant: TYPOGRAPHY.H3,
          align: 'center',
          fontWeight: 'bold',
          boxProps: {
            margin: [0, 0, 4],
          },
        },
      },
      {
        element: 'Typography',
        key: 'subtitle',
        children: pendingApproval.requestData.subtitle,
        props: {
          variant: TYPOGRAPHY.H6,
          align: 'center',
          boxProps: {
            margin: [0, 0, 4],
          },
        },
      },
      {
        element: 'div',
        key: 'text-area',
        children: {
          element: 'TextArea',
          props: {
            height: '400px',
            value: pendingApproval.requestData.prompt,
            resize: RESIZE.VERTICAL,
            scrollable: true,
            className: 'text',
          },
        },
        props: {
          className: 'snap-confirm',
        },
      },
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
            children: t('learnMore'),
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
    approvalText: t('sign'),
    cancelText: t('reject'),
    onApprove: () => actions.resolvePendingApproval(pendingApproval.id, true),
    onCancel: () => actions.resolvePendingApproval(pendingApproval.id, false),
  };
}

const snapConfirm = {
  getValues,
};

export default snapConfirm;
