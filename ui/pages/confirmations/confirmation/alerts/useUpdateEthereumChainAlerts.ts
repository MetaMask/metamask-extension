import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { Json } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { AlertActionKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  ApprovalsMetaMaskState,
  getApprovalsByOrigin,
} from '../../../../selectors';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const VALIDATED_APPROVAL_TYPES = [
  ApprovalType.AddEthereumChain,
  ApprovalType.SwitchEthereumChain,
];

export function useUpdateEthereumChainAlerts(
  pendingConfirmation: ApprovalRequest<Record<string, Json>>,
): Alert[] {
  const pendingConfirmationsFromOrigin = useSelector((state) =>
    getApprovalsByOrigin(
      state as ApprovalsMetaMaskState,
      pendingConfirmation?.origin,
    ),
  );
  const t = useI18nContext();

  return useMemo(() => {
    if (
      pendingConfirmationsFromOrigin?.length <= 1 ||
      (!VALIDATED_APPROVAL_TYPES.includes(
        pendingConfirmation.type as ApprovalType,
      ) &&
        (pendingConfirmation?.requestData?.metadata as Record<string, boolean>)
          ?.isSwitchEthereumChain !== true)
    ) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.ShowPendingConfirmation,
            label: t('reviewPendingTransactions'),
          },
        ],
        key: 'pendingConfirmationFromSameOrigin',
        message: t(
          pendingConfirmation.type === ApprovalType.AddEthereumChain
            ? 'pendingConfirmationAddNetworkAlertMessage'
            : 'pendingConfirmationSwitchNetworkAlertMessage',
          [pendingConfirmationsFromOrigin.length - 1],
        ),
        reason: t('areYouSure'),
        severity: Severity.Warning,
      },
    ];
  }, [
    pendingConfirmation?.type,
    pendingConfirmation?.requestData?.metadata,
    pendingConfirmationsFromOrigin?.length,
    t,
  ]);
}
