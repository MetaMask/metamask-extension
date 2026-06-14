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
import { useNonEvmBalance } from '../../useNonEvmBalance';
import { AlertsName } from '../constants';

const ZERO = new BigNumber(0);

type BalanceAlert = {
  message: string;
};

type MultichainBalances = ReturnType<typeof getMultichainBalances>;

type BalanceOverrides = {
  feeBalanceRaw?: string;
  transferBalanceRaw?: string;
};

type UniversalTransactionBalanceAlertState = {
  alerts: Alert[];
  isLoading: boolean;
};

export function useUniversalTransactionBalanceAlert(): UniversalTransactionBalanceAlertState {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<{ type?: string }>();
  const data = useUniversalTransactionDataOptional();
  const balances = useSelector(getMultichainBalances);
  const transferBalance = useNonEvmBalance({
    accountAddress: data?.from,
    assetId: data?.assetId,
    chainId: data?.chainId,
    decimals: data?.assetDecimals,
  });
  const feeBalance = useNonEvmBalance({
    accountAddress: data?.from,
    assetId: data?.feeAssetId,
    chainId: data?.chainId,
    decimals: data?.feeAssetDecimals,
  });
  const isUniversalTransaction =
    currentConfirmation?.type === UNIVERSAL_TRANSACTION_APPROVAL_TYPE;
  const transferBalanceRaw = transferBalance.balanceRaw;
  const transferBalanceIsLoaded = transferBalance.isLoaded;
  const transferBalanceIsSupported = transferBalance.isSupported;
  const feeBalanceRaw = feeBalance.balanceRaw;
  const feeBalanceIsLoaded = feeBalance.isLoaded;
  const feeBalanceIsSupported = feeBalance.isSupported;

  return useMemo(() => {
    if (!isUniversalTransaction || !data) {
      return { alerts: [], isLoading: false };
    }

    if (
      !areStrictBalancesLoaded({
        feeBalanceIsLoaded,
        feeBalanceIsSupported,
        transferBalanceIsLoaded,
        transferBalanceIsSupported,
      })
    ) {
      return { alerts: [], isLoading: true };
    }

    const balanceAlert = getBalanceAlert(data, balances, t, {
      transferBalanceRaw:
        transferBalanceIsLoaded && transferBalanceRaw !== undefined
          ? transferBalanceRaw
          : undefined,
      feeBalanceRaw:
        feeBalanceIsLoaded && feeBalanceRaw !== undefined
          ? feeBalanceRaw
          : undefined,
    });

    if (!balanceAlert) {
      return { alerts: [], isLoading: false };
    }

    return {
      alerts: [
        {
          field: RowAlertKey.EstimatedFee,
          isBlocking: true,
          key: AlertsName.UniversalTransactionInsufficientBalance,
          message: balanceAlert.message,
          reason: t('alertReasonInsufficientBalance'),
          severity: Severity.Danger,
        },
      ],
      isLoading: false,
    };
  }, [
    balances,
    data,
    feeBalanceIsLoaded,
    feeBalanceIsSupported,
    feeBalanceRaw,
    isUniversalTransaction,
    t,
    transferBalanceIsLoaded,
    transferBalanceIsSupported,
    transferBalanceRaw,
  ]);
}

function areStrictBalancesLoaded({
  feeBalanceIsLoaded,
  feeBalanceIsSupported,
  transferBalanceIsLoaded,
  transferBalanceIsSupported,
}: {
  feeBalanceIsLoaded: boolean;
  feeBalanceIsSupported: boolean;
  transferBalanceIsLoaded: boolean;
  transferBalanceIsSupported: boolean;
}) {
  return (
    (!transferBalanceIsSupported || transferBalanceIsLoaded) &&
    (!feeBalanceIsSupported || feeBalanceIsLoaded)
  );
}

function getBalanceAlert(
  data: UniversalTransactionData,
  balances: MultichainBalances,
  t: ReturnType<typeof useI18nContext>,
  balanceOverrides: BalanceOverrides,
): BalanceAlert | undefined {
  const { transferAmount, feeAmount, transferBalance, feeBalance } =
    getBalanceAmounts(data, balances, balanceOverrides);

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
  balanceOverrides: BalanceOverrides,
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
  const transferBalance =
    balanceOverrides.transferBalanceRaw === undefined
      ? toRawAmount(rawTransferBalance, data.assetDecimals)
      : toBigNumber(balanceOverrides.transferBalanceRaw);
  const feeBalance =
    balanceOverrides.feeBalanceRaw === undefined
      ? toRawAmount(rawFeeBalance, data.feeAssetDecimals)
      : toBigNumber(balanceOverrides.feeBalanceRaw);

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
