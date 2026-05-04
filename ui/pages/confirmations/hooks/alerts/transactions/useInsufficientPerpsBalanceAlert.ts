'use no memo';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { parseStandardTokenTransactionData } from '../../../../../../shared/lib/transaction.utils';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../../context/confirm';
import { getTokenTransferData } from '../../../utils/transaction-pay';
import { ARBITRUM_USDC } from '../../../constants/perps';
import { AlertsName } from '../constants';

type PerpsAccountState = {
  metamask: {
    accountState?: {
      availableBalance?: string;
      availableToTradeBalance?: string;
    } | null;
  };
};

function getWithdrawAmountHuman(transactionMeta?: TransactionMeta): BigNumber {
  const transferData = getTokenTransferData(transactionMeta)?.data;

  if (!transferData) {
    return new BigNumber(0);
  }

  const parsedData = parseStandardTokenTransactionData(transferData);
  const amountRaw = parsedData?.args?._value;

  if (!amountRaw) {
    return new BigNumber(0);
  }

  return new BigNumber(amountRaw.toString()).dividedBy(
    new BigNumber(10).pow(ARBITRUM_USDC.decimals),
  );
}

export function useInsufficientPerpsBalanceAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const availableBalance = useSelector(
    (state: PerpsAccountState) =>
      state.metamask.accountState?.availableToTradeBalance ??
      state.metamask.accountState?.availableBalance,
  );

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

  const showAlert = useMemo(() => {
    if (!isPerpsWithdraw || availableBalance === undefined) {
      return false;
    }

    const amountHuman = getWithdrawAmountHuman(currentConfirmation);

    return amountHuman.gt(0) && new BigNumber(availableBalance).lt(amountHuman);
  }, [availableBalance, currentConfirmation, isPerpsWithdraw]);

  return useMemo(() => {
    if (!showAlert) {
      return [];
    }

    return [
      {
        key: AlertsName.InsufficientPerpsBalance,
        field: RowAlertKey.Amount,
        isBlocking: true,
        reason: t('alertInsufficientPayTokenBalance'),
        message: t('perpsWithdrawInsufficient'),
        severity: Severity.Danger,
      },
    ];
  }, [showAlert, t]);
}
