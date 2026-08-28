import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  selectPaymentOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../../selectors/transactionPayController';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import { usePayTokenAccountBalance } from '../../pay/usePayTokenAccountBalance';
import { useTransactionPayWithdraw } from '../../pay/useTransactionPayWithdraw';
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
  const transactionId = currentConfirmation?.id ?? '';
  const paymentOverride = useSelector((state: TransactionPayState) =>
    selectPaymentOverrideByTransactionId(state, transactionId),
  );
  const isMoneyPaymentOverride =
    paymentOverride === PaymentOverride.MoneyAccount;

  // Post-quote withdraws: `payToken` is the destination, not the source —
  // skip input/fees checks; gas check runs against the tx chain. Gate on the
  // post-quote flag rather than the transaction type: with post-quote disabled
  // the withdraw is a direct transfer with regular source-token semantics.
  const { canSelectWithdrawToken: isPostQuote } = useTransactionPayWithdraw();

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

  // Live funding-account raw balance. USD still prefers the Pay-with
  // snapshot when the live rate would understate it (see
  // `usePayTokenAccountBalance`).
  const { balanceUsd: liveBalanceUsd, balanceRaw } =
    usePayTokenAccountBalance();
  const balanceUsd = useMemo(() => {
    const snapshot = new BigNumber(payToken?.balanceUsd ?? '0');
    const live = new BigNumber(liveBalanceUsd ?? '0');
    return BigNumber.max(snapshot, live).toString(10);
  }, [liveBalanceUsd, payToken?.balanceUsd]);
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

  const isInsufficientForFees = useMemo(() => {
    if (isMoneyPaymentOverride || isPostQuote || isPendingAlert || !payToken) {
      return false;
    }

    // A 0 raw snapshot is common on money-account deposits (tx `from` is the
    // money account). Do not treat that as "user has no tokens" — fall back
    // to USD when we have no positive raw balance to compare.
    const hasRawBalance = new BigNumber(balanceRaw ?? '0').gt(0);
    if (hasRawBalance) {
      return totalSourceAmountRaw.gt(balanceRaw ?? '0');
    }

    const sourceUsd = new BigNumber(totals?.sourceAmount?.usd ?? '0').plus(
      isPayTokenNative || isSourceGasFeeToken
        ? new BigNumber(totals?.fees?.sourceNetwork?.max?.usd ?? '0')
        : '0',
    );

    return sourceUsd.gt(0) && sourceUsd.gt(balanceUsd ?? '0');
  }, [
    balanceRaw,
    balanceUsd,
    isMoneyPaymentOverride,
    isPayTokenNative,
    isPendingAlert,
    isPostQuote,
    isSourceGasFeeToken,
    payToken,
    totalSourceAmountRaw,
    totals,
  ]);

  // Pay-with Money Account: deposit amount and fees come from the same
  // money-account balance. The input-only check can pass while amount+fees
  // still exceed it. Skip for Max: atomic is cleared so the deposit amount
  // is reduced to leave room for fees.
  const isInsufficientForMoneyAccountTotal = useMemo(
    () =>
      isMoneyPaymentOverride &&
      !isMax &&
      !isPostQuote &&
      !isPendingAlert &&
      totals?.total?.usd !== undefined &&
      new BigNumber(totals.total.usd).gt(balanceUsd ?? '0'),
    [
      balanceUsd,
      isMax,
      isMoneyPaymentOverride,
      isPendingAlert,
      isPostQuote,
      totals,
    ],
  );

  // Post-quote can run before `payToken` is set (auto-selection skipped);
  // gas check is independent of `payToken`.
  // Monad source gas is sponsored for money-account deposits, so a missing
  // MON balance must not block paying with Monad mUSD.
  const isInsufficientForSourceNetwork = useMemo(
    () =>
      sourceChainId !== CHAIN_IDS.MONAD &&
      !isMoneyPaymentOverride &&
      (payToken || isPostQuote) &&
      !isPayTokenNative &&
      !isPendingAlert &&
      !isSourceGasFeeToken &&
      totalSourceNetworkFeeRaw.gt(nativeBalanceRaw),
    [
      isMoneyPaymentOverride,
      isPayTokenNative,
      isPendingAlert,
      isPostQuote,
      isSourceGasFeeToken,
      nativeBalanceRaw,
      payToken,
      sourceChainId,
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

    if (isInsufficientForMoneyAccountTotal) {
      return [
        {
          ...baseAlert,
          key: AlertsName.InsufficientPayTokenBalance,
          reason: t('alertInsufficientPayTokenBalance'),
          message: t('alertInsufficientPayTokenBalanceFeesNoTarget'),
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
    isInsufficientForMoneyAccountTotal,
    isInsufficientForFees,
    isInsufficientForSourceNetwork,
    ticker,
    t,
  ]);
}
