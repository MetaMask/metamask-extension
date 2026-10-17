import { ApprovalRequest } from '@metamask/approval-controller';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import { Json } from '@metamask/utils';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TypographyVariant,
} from '../../../../helpers/constants/design-system';

type StateLogExportActions = {
  resolvePendingApproval: (id: string, value: string) => void;
  rejectPendingApproval: (id: string, error: Json) => void;
};

/**
 * Returns the templated values to be consumed in the confirmation page.
 *
 * @param pendingApproval - The pending confirmation object.
 * @param t - Translation function.
 * @param actions - Object containing safe actions that the template can invoke.
 * @returns An object containing templated values for the confirmation page.
 */
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
    // Built here rather than in the background so the payload is identical to
    // the Settings download, which also runs `window.logStateString()`. The
    // background only sees the flattened controller state, not the UI slices.
    onSubmit: async () => {
      try {
        const stateLogs = await window.logStateString();
        actions.resolvePendingApproval(pendingApproval.id, stateLogs);
      } catch (error) {
        actions.rejectPendingApproval(
          pendingApproval.id,
          rpcErrors
            .internal({
              message:
                (error as Error)?.message ?? 'Failed to build state logs',
            })
            .serialize(),
        );
      }
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
