'use no memo';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsMaxAmount,
  useTransactionPayRequiredTokens,
  useTransactionPayTotals,
} from '../../pay/useTransactionPayData';
import { getNativeTokenInfo } from '../../../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { AlertsName } from '../constants';
import { useMultichainBalances } from '../../../../../hooks/useMultichainBalances';
import { useConfirmContext } from '../../../context/confirm';

export function useInsufficientPayTokenBalanceAlert({
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

  const nativeTokenAddress = getNativeTokenAddress(sourceChainId);
  const { assetsWithBalance } = useMultichainBalances();

  const nativeToken = useMemo(() => {
    if (!selectedAddress || !sourceChainId) {
      return undefined;
    }
    return assetsWithBalance.find(
      (asset) =>
        asset.chainId === sourceChainId &&
        asset.address?.toLowerCase() === nativeTokenAddress?.toLowerCase(),
    );
  }, [assetsWithBalance, nativeTokenAddress, selectedAddress, sourceChainId]);

  const { balanceUsd, balanceRaw } = payToken ?? {};
  const nativeBalanceRaw = nativeToken?.balance ?? '0';

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
    () => payToken && totalAmountUsd.gt(balanceUsd ?? '0'),
    [balanceUsd, payToken, totalAmountUsd],
  );

  const isInsufficientForFees = useMemo(
    () =>
      !isPendingAlert && payToken && totalSourceAmountRaw.gt(balanceRaw ?? '0'),
    [balanceRaw, isPendingAlert, payToken, totalSourceAmountRaw],
  );

  const isInsufficientForSourceNetwork = useMemo(
    () =>
      payToken &&
      !isPayTokenNative &&
      !isPendingAlert &&
      !isSourceGasFeeToken &&
      totalSourceNetworkFeeRaw.gt(nativeBalanceRaw),
    [
      isPayTokenNative,
      isPendingAlert,
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
