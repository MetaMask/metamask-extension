'use no memo';

import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  getApprovedAndSignedTransactions,
  getTransactions,
} from '../../../../../selectors';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useConfirmContext } from '../../../context/confirm';
import { isCorrectDeveloperTransactionType } from '../../../../../../shared/lib/confirmation.utils';
import { AlertsName } from '../constants';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';

const PENDING_STATUSES = [
  TransactionStatus.approved,
  TransactionStatus.signed,
  TransactionStatus.submitted,
];

export function useSigningOrSubmittingAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const { type, chainId, txParams } = (currentConfirmation ?? {}) as
    | TransactionMeta
    | Record<string, never>;
  const from = txParams?.from;

  const { payToken } = useTransactionPayToken();

  const signingOrSubmittingTransactions = useSelector(
    getApprovedAndSignedTransactions,
  );

  const allTransactions = useSelector(getTransactions);

  const isValidType = isCorrectDeveloperTransactionType(type);

  const isSigningOrSubmitting =
    isValidType && signingOrSubmittingTransactions.length > 0;

  const payTokenChainId = payToken?.chainId;
  const isPayTokenOnDifferentChain =
    payTokenChainId && payTokenChainId !== chainId;

  const hasPendingTransactionOnPayChain = useMemo(() => {
    if (!isPayTokenOnDifferentChain || !from) {
      return false;
    }

    return allTransactions.some(
      (tx: TransactionMeta) =>
        tx.chainId === payTokenChainId &&
        tx.txParams?.from?.toLowerCase() === from.toLowerCase() &&
        PENDING_STATUSES.includes(tx.status),
    );
  }, [allTransactions, payTokenChainId, isPayTokenOnDifferentChain, from]);

  const showAlert = isSigningOrSubmitting || hasPendingTransactionOnPayChain;

  return useMemo(() => {
    if (!showAlert) {
      return [];
    }

    return [
      {
        isBlocking: true,
        key: AlertsName.SigningOrSubmitting,
        message: hasPendingTransactionOnPayChain
          ? t('isSigningOrSubmittingPayToken')
          : t('isSigningOrSubmitting'),
        severity: Severity.Danger,
      },
    ];
  }, [showAlert, hasPendingTransactionOnPayChain, t]);
}
