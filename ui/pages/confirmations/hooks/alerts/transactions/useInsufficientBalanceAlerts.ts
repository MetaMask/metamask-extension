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
import { useConfirmContext } from '../../../context/confirm';
import { useIsGaslessSupported } from '../../gas/useIsGaslessSupported';
import { useHasInsufficientBalance } from '../../useHasInsufficientBalance';

export function useInsufficientBalanceAlerts({
  ignoreGasFeeToken,
}: {
  ignoreGasFeeToken?: boolean;
} = {}): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { selectedGasFeeToken, gasFeeTokens } = currentConfirmation ?? {};
  const { hasInsufficientBalance, nativeCurrency } =
    useHasInsufficientBalance();

  const isSimulationEnabled = useSelector(getUseTransactionSimulations);

  const isSponsored = currentConfirmation?.isGasFeeSponsored;
  const {
    isSupported: isGaslessSupported,
    pending: isGaslessSupportedPending,
  } = useIsGaslessSupported();

  const isGasFeeTokensEmpty = gasFeeTokens?.length === 0;
  const hasNoGasFeeTokenSelected = ignoreGasFeeToken || !selectedGasFeeToken;

  const isGaslessCheckComplete =
    !isGaslessSupportedPending && isGaslessSupported;

  const isSponsoredTransaction = isSponsored && isGaslessCheckComplete;

  const isSimulationComplete = !isSimulationEnabled || Boolean(gasFeeTokens);

  const isGaslessEligibleForAlert =
    (isGasFeeTokensEmpty && isGaslessCheckComplete) ||
    (!isGasFeeTokensEmpty && !isGaslessCheckComplete);

  const showAlert =
    hasInsufficientBalance &&
    isSimulationComplete &&
    hasNoGasFeeTokenSelected &&
    isGaslessEligibleForAlert &&
    !isSponsoredTransaction;

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
