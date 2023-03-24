import { ethErrors } from 'eth-rpc-errors';
import {
  SEVERITIES,
  TypographyVariant,
} from '../../../helpers/constants/design-system';

function getAlerts(_pendingApproval) {
  return [
    {
      id: 'EXAMPLE_ALERT',
      severity: SEVERITIES.DANGER,
      content: {
        element: 'span',
        children: 'Example Alert Text',
      },
    },
  ];
}

function getValues(pendingApproval, t, actions, _history) {
  return {
    content: [
      {
        element: 'Typography',
        key: 'title',
        children: 'Example',
        props: {
          variant: TypographyVariant.H3,
          align: 'center',
          fontWeight: 'bold',
        },
      },
      {
        element: 'Typography',
        key: 'description',
        children: 'Do you want to perform an action?',
        props: {
          variant: TypographyVariant.H7,
          align: 'center',
        },
      },
      {
        element: 'Typography',
        key: 'requestData',
        children: `Request Data: ${pendingApproval.requestData.value}`,
        props: {
          variant: TypographyVariant.H7,
          align: 'center',
        },
      },
      {
        element: 'Typography',
        key: 'requestState',
        children: `Request State: ${pendingApproval.requestState.counter}`,
        props: {
          variant: TypographyVariant.H7,
          align: 'center',
        },
      },
    ],
    cancelText: t('cancel'),
    submitText: t('approveButtonText'),
    loadingText: t('addingCustomNetwork'),
    onSubmit: () =>
      actions.resolvePendingApproval(
        pendingApproval.id,
        pendingApproval.requestData,
      ),
    onCancel: () =>
      actions.rejectPendingApproval(
        pendingApproval.id,
        ethErrors.provider.userRejectedRequest().serialize(),
      ),
    networkDisplay: false,
  };
}

const example = {
  getAlerts,
  getValues,
};

export default example;
