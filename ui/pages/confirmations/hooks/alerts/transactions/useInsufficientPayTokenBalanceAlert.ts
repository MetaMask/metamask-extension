'use no memo';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import { useTokenWithBalance } from '../../tokens/useTokenWithBalance';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsMaxAmount,
  useTransactionPayIsPostQuote,
  useTransactionPayRequiredTokens,
  useTransactionPayTotals,
} from '../../pay/useTransactionPayData';
import { getNativeTokenInfo } from '../../../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/lib/selectors/networks';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../../context/confirm';
import { AlertsName } from '../constants';

export function useInsufficientPayTokenBalanceAlert({
  pendingAmountUsd,
}: {
  pendingAmountUsd?: string;
} = {}): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { payToken } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();
  const totals = useTransactionPayTotals();
  const isLoading = useIsTransactionPayLoading();
  const isSourceGasFeeToken = totals?.fees.isSourceGasFeeToken ?? false;
  const isPendingAlert = Boolean(pendingAmountUsd !== undefined);
  const isMax = useTransactionPayIsMaxAmount();
  const isPostQuote = useTransactionPayIsPostQuote();
  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

  const sourceChainId = (
    isPostQuote
      ? currentConfirmation?.chainId ?? '0x0'
      : payToken?.chainId ?? '0x0'
  ) as Hex;

  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const nativeTokenInfo = getNativeTokenInfo(
    networkConfigurationsByChainId,
    sourceChainId,
  );
  const ticker = nativeTokenInfo?.symbol ?? 'ETH';

  const nativeTokenAddress = getNativeTokenAddress(sourceChainId);
  const nativeToken = useTokenWithBalance(nativeTokenAddress, sourceChainId);

  const { balanceUsd, balanceRaw } = payToken ?? {};
  const nativeBalanceRaw = nativeToken?.balanceRaw ?? '0';
  const isPayTokenNativeOnSourceChain =
    Boolean(payToken) &&
    payToken?.address.toLowerCase() === nativeTokenAddress.toLowerCase() &&
    payToken?.chainId === sourceChainId;

  const totalAmountUsd = useMemo(() => {
    if (isMax) {
      return new BigNumber(balanceUsd ?? '0');
    }

    if (pendingAmountUsd) {
      return new BigNumber(pendingAmountUsd);
    }

    return (requiredTokens ?? [])
      .filter((token) => !token.skipIfBalance)
      .reduce(
        (acc, token) => acc.plus(new BigNumber(token.amountUsd)),
        new BigNumber(0),
      );
  }, [balanceUsd, isMax, pendingAmountUsd, requiredTokens]);

  const totalSourceAmountRaw = useMemo(() => {
    if (isLoading) {
      return new BigNumber(0);
    }

    return new BigNumber(totals?.sourceAmount.raw ?? '0').plus(
      isPayTokenNativeOnSourceChain || isSourceGasFeeToken
        ? new BigNumber(totals?.fees.sourceNetwork.max.raw ?? '0')
        : '0',
    );
  }, [isLoading, isPayTokenNativeOnSourceChain, isSourceGasFeeToken, totals]);

  const totalSourceNetworkFeeRaw = useMemo(() => {
    if (isLoading) {
      return new BigNumber(0);
    }

    return new BigNumber(totals?.fees.sourceNetwork.max.raw ?? '0');
  }, [isLoading, totals]);

  const isReceiveTokenBalanceCheckSuppressed = isPostQuote || isPerpsWithdraw;

  const isInsufficientForInput = useMemo(
    () =>
      !isReceiveTokenBalanceCheckSuppressed &&
      payToken &&
      totalAmountUsd.gt(balanceUsd ?? '0'),
    [
      balanceUsd,
      isReceiveTokenBalanceCheckSuppressed,
      payToken,
      totalAmountUsd,
    ],
  );

  const isInsufficientForFees = useMemo(
    () =>
      !isReceiveTokenBalanceCheckSuppressed &&
      !isPendingAlert &&
      payToken &&
      totalSourceAmountRaw.gt(balanceRaw ?? '0'),
    [
      balanceRaw,
      isPendingAlert,
      isReceiveTokenBalanceCheckSuppressed,
      payToken,
      totalSourceAmountRaw,
    ],
  );

  const isInsufficientForSourceNetwork = useMemo(
    () =>
      (payToken || isPostQuote) &&
      !isPayTokenNativeOnSourceChain &&
      !isPendingAlert &&
      !isSourceGasFeeToken &&
      totalSourceNetworkFeeRaw.gt(nativeBalanceRaw),
    [
      isPayTokenNativeOnSourceChain,
      isPendingAlert,
      isPostQuote,
      isSourceGasFeeToken,
      nativeBalanceRaw,
      payToken,
      totalSourceNetworkFeeRaw,
    ],
  );

  return useMemo(() => {
    const baseAlert = {
      field: RowAlertKey.EstimatedFee,
      severity: Severity.Danger,
      isBlocking: true,
    };

    if (isInsufficientForInput) {
      return [
        {
          ...baseAlert,
          key: AlertsName.InsufficientPayTokenBalance,
          reason: t('alertInsufficientPayTokenBalance'),
          message: t('alertInsufficientPayTokenBalance'),
        },
      ];
    }

    if (isInsufficientForFees) {
      return [
        {
          ...baseAlert,
          key: AlertsName.InsufficientPayTokenFees,
          reason: t('alertInsufficientPayTokenBalance'),
          message: t('alertInsufficientPayTokenBalanceFeesNoTarget'),
        },
      ];
    }

    if (isInsufficientForSourceNetwork) {
      return [
        {
          ...baseAlert,
          key: AlertsName.InsufficientPayTokenNative,
          reason: t('alertInsufficientPayTokenBalance'),
          message: t('alertInsufficientPayTokenNative', [ticker]),
        },
      ];
    }

    return [];
  }, [
    isInsufficientForInput,
    isInsufficientForFees,
    isInsufficientForSourceNetwork,
    ticker,
    t,
  ]);
}
