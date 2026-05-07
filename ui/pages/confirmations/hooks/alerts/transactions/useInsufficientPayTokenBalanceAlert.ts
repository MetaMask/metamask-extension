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
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import { useTokenWithBalance } from '../../tokens/useTokenWithBalance';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsMaxAmount,
  useTransactionPayRequiredTokens,
  useTransactionPayTotals,
} from '../../pay/useTransactionPayData';
import { getNativeTokenInfo } from '../../../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/lib/selectors/networks';
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

  // Post-quote (perps withdraw): `payToken` is the destination, not the
  // source — skip input/fees checks; gas check runs against the tx chain.
  const isPostQuote = isPerpsWithdrawTransaction(currentConfirmation);

  const sourceChainId = (
    isPostQuote
      ? (currentConfirmation?.chainId ?? '0x0')
      : (payToken?.chainId ?? '0x0')
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

  // For post-quote, `payToken` is the destination so its native-ness has
  // no bearing on source gas — force false so the source-network check
  // evaluates against the user's actual native balance vs. the gas fee.
  // For non-post-quote, also gate on `chainId === sourceChainId` so a
  // native destination on a different chain can't suppress the check.
  // Use `nativeTokenAddress` (always defined for the source chain) rather
  // than `nativeToken?.address` (from `useTokenWithBalance`, undefined during
  // loading) so a real native pay token isn't briefly classified as
  // non-native and false-positive the source-network gas check.
  const isPayTokenNative =
    !isPostQuote &&
    Boolean(
      payToken &&
      payToken.address.toLowerCase() === nativeTokenAddress.toLowerCase() &&
      payToken.chainId === sourceChainId,
    );

  const { balanceUsd, balanceRaw } = payToken ?? {};
  const nativeBalanceRaw = nativeToken?.balanceRaw ?? '0';

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
      isPayTokenNative || isSourceGasFeeToken
        ? new BigNumber(totals?.fees.sourceNetwork.max.raw ?? '0')
        : '0',
    );
  }, [isLoading, isPayTokenNative, isSourceGasFeeToken, totals]);

  const totalSourceNetworkFeeRaw = useMemo(() => {
    if (isLoading) {
      return new BigNumber(0);
    }

    return new BigNumber(totals?.fees.sourceNetwork.max.raw ?? '0');
  }, [isLoading, totals]);

  const isInsufficientForInput = useMemo(
    () => !isPostQuote && payToken && totalAmountUsd.gt(balanceUsd ?? '0'),
    [balanceUsd, isPostQuote, payToken, totalAmountUsd],
  );

  const isInsufficientForFees = useMemo(
    () =>
      !isPostQuote &&
      !isPendingAlert &&
      payToken &&
      totalSourceAmountRaw.gt(balanceRaw ?? '0'),
    [balanceRaw, isPendingAlert, isPostQuote, payToken, totalSourceAmountRaw],
  );

  // Post-quote can run before `payToken` is set (auto-selection skipped);
  // gas check is independent of `payToken`.
  const isInsufficientForSourceNetwork = useMemo(
    () =>
      (payToken || isPostQuote) &&
      !isPayTokenNative &&
      !isPendingAlert &&
      !isSourceGasFeeToken &&
      totalSourceNetworkFeeRaw.gt(nativeBalanceRaw),
    [
      isPayTokenNative,
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
