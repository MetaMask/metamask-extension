'use no memo';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import type { Hex } from '@metamask/utils';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionPayToken } from '../pay/useTransactionPayToken';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsMaxAmount,
  useTransactionPayRequiredTokens,
  useTransactionPayTotals,
} from '../pay/useTransactionPayData';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import {
  getNativeTokenCachedBalanceByChainIdSelector,
  getNativeTokenInfo,
} from '../../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { AlertsName } from '../alerts/constants';
import { useConfirmContext } from '../../context/confirm';

export function usePerpsDepositInsufficientPayTokenBalanceAlert({
  pendingAmountUsd,
}: {
  pendingAmountUsd?: string;
} = {}): Alert[] {
  const t = useI18nContext();
  const { payToken, isNative: isPayTokenNative } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();
  const totals = useTransactionPayTotals();
  const isLoading = useIsTransactionPayLoading();
  const isSourceGasFeeToken = totals?.fees.isSourceGasFeeToken ?? false;
  const isPendingAlert = Boolean(pendingAmountUsd !== undefined);
  const isMax = useTransactionPayIsMaxAmount();

  const sourceChainId = (payToken?.chainId ?? '0x0') as Hex;

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const isPerpsDeposit =
    currentConfirmation?.type === TransactionType.perpsDeposit;
  const selectedAddress = currentConfirmation?.txParams?.from as
    | Hex
    | undefined;

  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const nativeTokenInfo = getNativeTokenInfo(
    networkConfigurationsByChainId,
    sourceChainId,
  );
  const ticker = nativeTokenInfo?.symbol ?? 'ETH';

  const nativeBalanceHex = useSelector(
    (state) =>
      (
        getNativeTokenCachedBalanceByChainIdSelector(
          state,
          selectedAddress ?? '',
        ) as Record<Hex, Hex>
      )[sourceChainId] ?? '0x0',
  ) as Hex;

  const { balanceUsd } = payToken ?? {};
  const payTokenBalanceRaw = payToken?.balanceRaw;
  const nativeBalanceRaw = useMemo(() => {
    return hexToDecimal(nativeBalanceHex);
  }, [nativeBalanceHex]);

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

    const shouldAddSourceNetworkFeeToSourceAmount =
      isPayTokenNative || isSourceGasFeeToken;

    return new BigNumber(totals?.sourceAmount.raw ?? '0').plus(
      shouldAddSourceNetworkFeeToSourceAmount
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
    () => isPerpsDeposit && payToken && totalAmountUsd.gt(balanceUsd ?? '0'),
    [balanceUsd, isPerpsDeposit, payToken, totalAmountUsd],
  );

  const isInsufficientForFees = useMemo(
    () =>
      isPerpsDeposit &&
      !isPendingAlert &&
      payToken &&
      payTokenBalanceRaw !== undefined &&
      totalSourceAmountRaw.gt(payTokenBalanceRaw),
    [
      isPerpsDeposit,
      isPendingAlert,
      payToken,
      payTokenBalanceRaw,
      totalSourceAmountRaw,
    ],
  );

  const isInsufficientForSourceNetwork = useMemo(
    () =>
      isPerpsDeposit &&
      payToken &&
      !isPayTokenNative &&
      !isPendingAlert &&
      !isSourceGasFeeToken &&
      totalSourceNetworkFeeRaw.gt(nativeBalanceRaw),
    [
      isPerpsDeposit,
      isPayTokenNative,
      isPendingAlert,
      isSourceGasFeeToken,
      nativeBalanceRaw,
      payToken,
      totalSourceNetworkFeeRaw,
    ],
  );

  return useMemo(() => {
    if (!isPerpsDeposit) {
      return [];
    }

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
    isPerpsDeposit,
    isInsufficientForInput,
    isInsufficientForFees,
    isInsufficientForSourceNetwork,
    ticker,
    t,
  ]);
}
