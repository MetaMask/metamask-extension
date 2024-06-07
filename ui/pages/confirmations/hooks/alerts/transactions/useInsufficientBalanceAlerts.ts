import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { TransactionMeta } from '@metamask/transaction-controller';
import useCurrentConfirmation from '../../useCurrentConfirmation';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  currentConfirmationSelector,
  selectTransactionAvailableBalance,
  selectTransactionFeeById,
  selectTransactionValue,
} from '../../../../../selectors';
import { isBalanceSufficient } from '../../../send/send.utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';

export function useInsufficientBalanceAlerts(): Alert[] {
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const { id: transactionId } = currentConfirmation ?? {};

  const balance = useSelector((state) =>
    selectTransactionAvailableBalance(state, transactionId),
  );

  const value = useSelector((state) =>
    selectTransactionValue(state, transactionId),
  );

  const { hexMaximumTransactionFee } = useSelector((state) =>
    selectTransactionFeeById(state, transactionId),
  );

  const insufficientBalance = !isBalanceSufficient({
    amount: value,
    gasTotal: hexMaximumTransactionFee,
    balance,
  });

  const t = useI18nContext();

  return useMemo(() => {
    if (!insufficientBalance) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: 'buy',
            label: 'Buy',
          },
        ],
        field: 'estimatedFee',
        isBlocking: true,
        key: 'insufficientBalance',
        message: t('insufficientCurrencyBuyOrDeposit', [
          'ETH',
          'Sepolia',
          'Buy',
        ]),
        reason: 'Insufficient Balance',
        severity: Severity.Danger,
      },
    ];
  }, [insufficientBalance]);
}
