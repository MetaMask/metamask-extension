'use no memo';

import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../../context/confirm';
import { Numeric } from '../../../../../../shared/modules/Numeric';
import { getMarketFeeFromEstimates } from '../../../../../../shared/modules/transaction.utils';
import { areDappSuggestedAndTxParamGasFeesTheSame } from '../../../../../helpers/utils/confirm-tx.util';
import { isNativeAddress } from '../../../../../helpers/utils/token-insights';

const DAPP_GAS_FEE_HIGH_THRESHOLD = 0.2; // 20% higher than market estimation

export function useSuggestedGasFeeHighAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const selectedGasFeeToken = currentConfirmation?.selectedGasFeeToken;
  // Use gasFeeEstimates from transactionMeta as it has more accurate
  // current values computed by the TransactionController gas logic
  const gasFeeEstimates = currentConfirmation?.gasFeeEstimates;

  return useMemo(() => {
    if (!currentConfirmation) {
      return [];
    }

    // Don't show alert if user is paying gas with a non-native token (e.g. ERC-20)
    if (selectedGasFeeToken && !isNativeAddress(selectedGasFeeToken)) {
      return [];
    }

    const { dappSuggestedGasFees } = currentConfirmation;

    // Only show alert if the transaction is still using dapp suggested values
    if (!areDappSuggestedAndTxParamGasFeesTheSame(currentConfirmation)) {
      return [];
    }

    // Get dapp suggested gas fee (either maxFeePerGas for EIP-1559 or gasPrice for legacy)
    const dappMaxFeePerGas =
      dappSuggestedGasFees?.maxFeePerGas ?? dappSuggestedGasFees?.gasPrice;

    if (!dappMaxFeePerGas) {
      return [];
    }

    // Get market estimation (medium level) from transaction's gas fee estimates
    const marketMaxFeePerGas = getMarketFeeFromEstimates(gasFeeEstimates);

    if (!marketMaxFeePerGas) {
      return [];
    }

    // Both values are hex WEI strings, convert to Numeric for comparison
    const dappFeeNumeric = new Numeric(dappMaxFeePerGas as string, 16);
    const marketFeeNumeric = new Numeric(marketMaxFeePerGas, 16);

    // Calculate threshold: market fee + 20%
    const threshold = marketFeeNumeric.times(
      new Numeric(1 + DAPP_GAS_FEE_HIGH_THRESHOLD, 10),
    );

    // Check if dapp suggested fee is at least 20% higher than market estimation
    const isDappFeeHigh = dappFeeNumeric.greaterThanOrEqualTo(threshold);

    if (!isDappFeeHigh) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.ShowGasFeeModal,
            label: t('alertActionEditNetworkFee'),
          },
        ],
        field: RowAlertKey.EstimatedFee,
        key: 'suggestedGasFeeHigh',
        message: t('alertMessageSuggestedGasFeeHigh'),
        reason: t('alertReasonSuggestedGasFeeHigh'),
        severity: Severity.Warning,
      },
    ];
  }, [currentConfirmation, gasFeeEstimates, selectedGasFeeToken, t]);
}
