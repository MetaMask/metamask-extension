import { Hex } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { TransactionMeta } from '@metamask/transaction-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  selectTransactionAvailableBalance,
  selectTransactionFeeById,
  selectTransactionValue,
} from '../../../../../selectors';
import { getMultichainNativeCurrency } from '../../../../../selectors/multichain';
import { isBalanceSufficient } from '../../../send/send.utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../../context/confirm';
import { sumHexes } from '../../../../../../shared/modules/conversion.utils';

export function useInsufficientBalanceAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    id: transactionId,
    chainId,
    selectedGasFeeToken,
  } = currentConfirmation ?? {};

  const batchTransactionValues =
    currentConfirmation?.nestedTransactions?.map(
      (trxn) => (trxn.value as Hex) ?? 0x0,
    ) ?? [];

  const balance = useSelector((state) =>
    selectTransactionAvailableBalance(state, transactionId, chainId),
  );

  const value = useSelector((state) =>
    selectTransactionValue(state, transactionId),
  );

  const totalValue = sumHexes(value, ...batchTransactionValues);

  const { hexMaximumTransactionFee } = useSelector((state) =>
    selectTransactionFeeById(state, transactionId),
  );

  const nativeCurrency = useSelector(getMultichainNativeCurrency);

  const insufficientBalance = !isBalanceSufficient({
    amount: totalValue,
    gasTotal: hexMaximumTransactionFee,
    balance,
  });

  const showAlert = insufficientBalance && !selectedGasFeeToken;

  return useMemo(() => {
    if (!showAlert) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.Buy,
            label: t('alertActionBuyWithNativeCurrency', [nativeCurrency]),
          },
        ],
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'insufficientBalance',
        message: t('alertMessageInsufficientBalanceWithNativeCurrency', [
          nativeCurrency,
        ]),
        reason: t('alertReasonInsufficientBalance'),
        severity: Severity.Danger,
      },
    ];
  }, [nativeCurrency, showAlert, t]);
}
