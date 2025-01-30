import {
  APPROVAL_TYPE_TRANSACTION_BATCH,
  TransactionBatchApprovalData,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useMemo } from 'react';

import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';

export function use7702Alerts(): Alert[] {
  const t = useI18nContext();

  const { currentConfirmation } = useConfirmContext<
    TransactionBatchApprovalData & { type: string }
  >();

  const isBatchTransaction =
    currentConfirmation.type ===
      (APPROVAL_TYPE_TRANSACTION_BATCH as TransactionType) &&
    currentConfirmation?.accountUpgradeRequired;

  return useMemo(() => {
    if (!isBatchTransaction) {
      return [];
    }

    return [
      {
        key: '7702',
        message:
          'To process transaction batch requests, your account will be upgraded to a smart contract account.',
        reason: 'Account Upgrade Required',
        severity: Severity.Info,
      },
    ];
  }, [isBatchTransaction]);
}
