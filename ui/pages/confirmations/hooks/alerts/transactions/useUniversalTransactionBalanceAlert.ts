import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { UNIVERSAL_TRANSACTION_APPROVAL_TYPE } from '../../../../../../shared/constants/confirmations';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getMultichainBalances } from '../../../../../selectors/multichain';
import { useConfirmContext } from '../../../context/confirm';
import {
  UniversalTransactionData,
  useUniversalTransactionDataOptional,
} from '../../transactions/useUniversalTransactionData';
import { AlertsName } from '../constants';

const ZERO = new BigNumber(0);

type BalanceAlert = {
  message: string;
};

type MultichainBalances = ReturnType<typeof getMultichainBalances>;

export function useUniversalTransactionBalanceAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<{ type?: string }>();
  const data = useUniversalTransactionDataOptional();
  const balances = useSelector(getMultichainBalances);
  const isUniversalTransaction =
    currentConfirmation?.type === UNIVERSAL_TRANSACTION_APPROVAL_TYPE;

  return useMemo(() => {
    if (!isUniversalTransaction || !data) {
      return [];
    }

    const balanceAlert = getBalanceAlert(data, balances, t);

    if (!balanceAlert) {
      return [];
    }

    return [
      {
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: AlertsName.UniversalTransactionInsufficientBalance,
        message: balanceAlert.message,
        reason: t('alertReasonInsufficientBalance'),
        severity: Severity.Danger,
      },
    ];
  }, [balances, data, isUniversalTransaction, t]);
}

function getBalanceAlert(
  data: UniversalTransactionData,
  balances: MultichainBalances,
  t: ReturnType<typeof useI18nContext>,
): BalanceAlert | undefined {
  const { transferAmount, feeAmount, transferBalance, feeBalance } =
    getBalanceAmounts(data, balances);

  if (data.assetId === data.feeAssetId) {
    const requiredBalance = transferAmount.plus(feeAmount);

    if (transferBalance.gte(requiredBalance)) {
      return undefined;
    }

    return {
      message: transferBalance.gte(transferAmount)
        ? t('insufficientBalanceToCoverFees')
        : t('insufficientFundsSend'),
    };
  }

  if (transferBalance.lt(transferAmount)) {
    return {
      message: t('insufficientFundsSend'),
    };
  }

  if (data.feeAmount && feeBalance.lt(feeAmount)) {
    return {
      message: t('insufficientBalanceToCoverFees'),
    };
  }

  return undefined;
}

function getBalanceAmounts(
  data: UniversalTransactionData,
  balances: MultichainBalances,
) {
  const transferAmount = toBigNumber(data.amount);
  const feeAmount = toBigNumber(data.feeAmount);
  const rawTransferBalance = getDisplayBalanceAmount(
    balances,
    data.accountId,
    data.assetId,
  );
  const rawFeeBalance = getDisplayBalanceAmount(
    balances,
    data.accountId,
    data.feeAssetId,
  );
  const transferBalance = toRawAmount(rawTransferBalance, data.assetDecimals);
  const feeBalance = toRawAmount(rawFeeBalance, data.feeAssetDecimals);

  return {
    transferAmount,
    feeAmount,
    transferBalance,
    feeBalance,
  };
}

function getDisplayBalanceAmount(
  balances: MultichainBalances,
  accountId: string,
  assetId: string | undefined,
) {
  if (!assetId) {
    return undefined;
  }

  return balances?.[accountId]?.[assetId]?.amount;
}

function toRawAmount(value: string | undefined, decimals: number | undefined) {
  return toBigNumber(value).times(new BigNumber(10).pow(decimals ?? 0));
}

function toBigNumber(value: string | number | undefined) {
  const valueBigNumber = new BigNumber(value ?? 0);

  return valueBigNumber.isFinite() ? valueBigNumber : ZERO;
}
