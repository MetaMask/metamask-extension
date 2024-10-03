import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getApprovedAndSignedTransactions } from '../../../../../selectors';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { REDESIGN_DEV_TRANSACTION_TYPES } from '../../../utils';
import { useConfirmContext } from '../../../context/confirm';

export function useSigningOrSubmittingAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const { type } = (currentConfirmation ?? {}) as TransactionMeta;

  const signingOrSubmittingTransactions = useSelector(
    getApprovedAndSignedTransactions,
  );

  const isValidType = REDESIGN_DEV_TRANSACTION_TYPES.includes(
    type as TransactionType,
  );

  const isSigningOrSubmitting =
    isValidType && signingOrSubmittingTransactions.length > 0;

  return useMemo(() => {
    if (!isSigningOrSubmitting) {
      return [];
    }

    return [
      {
        isBlocking: true,
        key: 'signingOrSubmitting',
        message: t('alertMessageSigningOrSubmitting'),
        severity: Severity.Warning,
      },
    ];
  }, [isSigningOrSubmitting]);
}
