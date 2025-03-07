import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { AlertActionKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import { getApprovalsByOrigin } from '../../../../selectors';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const VALIDATED_APPROVAL_TYPES = [
  ApprovalType.AddEthereumChain,
  ApprovalType.SwitchEthereumChain,
];

export function useAddEthereumChainAlerts(
  pendingConfirmation: ApprovalRequest<{ id: string }>,
): Alert[] {
  const pendingConfirmationsFromOrigin = useSelector((state) =>
    getApprovalsByOrigin(state, pendingConfirmation?.origin),
  );

  const t = useI18nContext();
  return useMemo(() => {
    if (
      pendingConfirmationsFromOrigin?.length <= 1 ||
      !VALIDATED_APPROVAL_TYPES.includes(
        pendingConfirmation?.type as ApprovalType,
      )
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
        message: t('pendingConfirmationAddNetworkAlertMessage', [
          pendingConfirmationsFromOrigin.length - 1,
        ]),
        reason: t('areYouSure'),
        severity: Severity.Warning,
      },
    ];
  }, [pendingConfirmation?.type, pendingConfirmationsFromOrigin?.length, t]);
}
