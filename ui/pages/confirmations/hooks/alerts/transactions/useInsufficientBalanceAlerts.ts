'use no memo';

import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getUseTransactionSimulations } from '../../../../../selectors';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../../context/confirm';
import { useIsGaslessSupported } from '../../gas/useIsGaslessSupported';
import { useHasInsufficientBalance } from '../../useHasInsufficientBalance';
import { useTransactionPayHasSourceAmount } from '../../pay/useTransactionPayHasSourceAmount';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';

export function useInsufficientBalanceAlerts({
  ignoreGasFeeToken,
}: {
  ignoreGasFeeToken?: boolean;
} = {}): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { selectedGasFeeToken, gasFeeTokens, excludeNativeTokenForFee } =
    currentConfirmation ?? {};
  // Gasless flows (Perps Withdraw via HyperLiquid -> Relay) don't use the
  // user's native balance for gas, so suppress the "insufficient balance"
  // alert even when native balance is low.
  const isIgnoredType = isPerpsWithdrawTransaction(currentConfirmation);
  const { hasInsufficientBalance, nativeCurrency } =
    useHasInsufficientBalance();
  const isSimulationEnabled = useSelector(getUseTransactionSimulations);
  const isSponsored = currentConfirmation?.isGasFeeSponsored;
  const {
    isSupported: isGaslessSupported,
    pending: isGaslessSupportedPending,
  } = useIsGaslessSupported();

  const isUsingPay = useTransactionPayHasSourceAmount();
  const { payToken } = useTransactionPayToken();
  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();

  const isPayPendingInput =
    Boolean(payToken) && primaryRequiredToken?.amountRaw === '0';

  const isGasFeeTokensEmpty = gasFeeTokens?.length === 0;

  // Check if gasless check has completed (regardless of result)
  const isGaslessCheckComplete = !isGaslessSupportedPending;

  // Transaction is sponsored only if it's marked as sponsored AND gasless is supported
  const isSponsoredTransaction = isSponsored && isGaslessSupported;

  // Simulation is complete if it's disabled, or if enabled and gasFeeTokens is loaded
  const isSimulationComplete = !isSimulationEnabled || Boolean(gasFeeTokens);

  // Check if user has selected a gas fee token (or we're ignoring that check)
  // Note: In the case of chains with no native token (ex: Tempo), `selectedGasFeeToken`
  // may be populated despite no gas token being available.
  // For those chains, `excludeNativeTokenForFee` will always be `true`, hence we can
  // rely on the combination of `excludeNativeTokenForFee` and `isGasFeeTokensEmpty`.
  const hasNoGasFeeTokenSelected =
    ignoreGasFeeToken ||
    !selectedGasFeeToken ||
    (excludeNativeTokenForFee && isGasFeeTokensEmpty);

  // Gasless check is complete AND one of:
  //  - Gasless is NOT supported (native currency needed for gas)
  //  - Gasless IS supported but no alternative gas fee tokens are available
  //  - Gas fee tokens are available but none is selected
  const shouldCheckGaslessConditions =
    isGaslessCheckComplete &&
    (!isGaslessSupported ||
      isGasFeeTokensEmpty ||
      (!isGasFeeTokensEmpty && !selectedGasFeeToken));

  const showAlert =
    hasInsufficientBalance &&
    !isUsingPay &&
    !isPayPendingInput &&
    isSimulationComplete &&
    hasNoGasFeeTokenSelected &&
    shouldCheckGaslessConditions &&
    !isSponsoredTransaction &&
    !isIgnoredType;

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
