import {
  APPROVAL_TYPE_TRANSACTION_BATCH,
  TransactionBatchApprovalData,
  TransactionEnvelopeType,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useMemo } from 'react';

import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useConfirmContext } from '../../../context/confirm';

export function use7702Alerts(): Alert[] {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isBatchTransaction =
    currentConfirmation?.type === TransactionType.batch &&
    currentConfirmation?.txParams?.type === TransactionEnvelopeType.setCode;

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
