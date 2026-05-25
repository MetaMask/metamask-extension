import type { ApprovalRequest } from '@metamask/approval-controller';
import { providerErrors } from '@metamask/rpc-errors';
import type { Json } from '@metamask/utils';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TypographyVariant,
} from '../../../../helpers/constants/design-system';

type StateLogExportActions = {
  resolvePendingApproval: (id: string, value: string) => void;
  rejectPendingApproval: (
    id: string,
    error: ReturnType<typeof providerErrors.userRejectedRequest>['serialize'],
  ) => void;
};

function getValues(
  pendingApproval: ApprovalRequest<Record<string, Json>>,
  t: (key: string) => string,
  actions: StateLogExportActions,
) {
  return {
    content: [
      {
        element: 'Typography',
        key: 'title',
        children: t('stateLogExportApprovalTitle'),
        props: {
          variant: TypographyVariant.H3,
          align: 'center',
          fontWeight: 'normal',
          boxProps: {
            margin: [0, 0, 2],
            padding: [0, 4, 0, 4],
          },
        },
      },
      {
        element: 'Typography',
        key: 'description',
        children: t('stateLogExportApprovalDescription'),
        props: {
          variant: TypographyVariant.H7,
          color: TextColor.textAlternative,
          align: 'center',
          boxProps: {
            padding: [0, 4, 0, 4],
          },
        },
      },
      {
        element: 'Box',
        key: 'warning-box',
        props: {
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          alignItems: AlignItems.flexStart,
          padding: 4,
          margin: [2, 4, 0],
          className: 'confirmation-warning-wrapper',
        },
        children: [
          {
            element: 'Typography',
            key: 'pii-header',
            children: t('stateLogExportApprovalIncluded'),
            props: {
              variant: TypographyVariant.H7,
              fontWeight: 'bold',
              color: TextColor.warningDefault,
              boxProps: { margin: [0, 0, 1] },
            },
          },
          {
            element: 'Typography',
            key: 'pii-body',
            children: t('stateLogExportApprovalWarning'),
            props: {
              variant: TypographyVariant.H7,
              color: TextColor.textDefault,
            },
          },
          {
            element: 'Typography',
            key: 'pii-excludes',
            children: t('stateLogExportApprovalExcludes'),
            props: {
              variant: TypographyVariant.H7,
              color: TextColor.textAlternative,
              boxProps: { margin: [1, 0, 0] },
            },
          },
        ],
      },
    ],
    submitText: t('stateLogExportApprovalConfirm'),
    cancelText: t('cancel'),
    onSubmit: async () => {
      const stateString = await window.logStateString();
      actions.resolvePendingApproval(pendingApproval.id, stateString);
    },
    onCancel: () =>
      actions.rejectPendingApproval(
        pendingApproval.id,
        providerErrors.userRejectedRequest().serialize(),
      ),
  };
}

const stateLogExport = { getValues };

export default stateLogExport;
