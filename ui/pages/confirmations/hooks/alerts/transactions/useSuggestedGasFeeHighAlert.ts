'use no memo';

import { useMemo } from 'react';
import { DefaultRootState, useSelector } from 'react-redux';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../../context/confirm';
import { getGasFeeEstimatesByChainId } from '../../../../../ducks/metamask/metamask';
import { hexWEIToDecGWEI } from '../../../../../../shared/modules/conversion.utils';
import { Numeric } from '../../../../../../shared/modules/Numeric';
import { areDappSuggestedAndTxParamGasFeesTheSame } from '../../../../../helpers/utils/confirm-tx.util';
import { isNativeAddress } from '../../../../../helpers/utils/token-insights';

const DAPP_GAS_FEE_HIGH_THRESHOLD = 0.2; // 20% higher than market estimation

export function useSuggestedGasFeeHighAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const chainId = currentConfirmation?.chainId;
  const selectedGasFeeToken = currentConfirmation?.selectedGasFeeToken;

  const gasFeeEstimates = useSelector((state) =>
    chainId
      ? (
          getGasFeeEstimatesByChainId as (
            state: DefaultRootState,
            chainId: Hex,
          ) => GasFeeEstimates
        )(state, chainId as Hex)
      : undefined,
  );

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

    // Get market estimation (medium level) from gas fee estimates
    const marketMaxFeePerGas = gasFeeEstimates?.medium?.suggestedMaxFeePerGas;

    if (!marketMaxFeePerGas) {
      return [];
    }

    // Convert dapp suggested fee from hex WEI to decimal GWEI for comparison
    const dappFeeInGwei = new Numeric(
      hexWEIToDecGWEI(dappMaxFeePerGas as string),
      10,
    );

    // Market estimation is already in GWEI
    const marketFeeInGwei = new Numeric(marketMaxFeePerGas, 10);

    // Calculate threshold: market fee + 20%
    const threshold = marketFeeInGwei.times(
      new Numeric(1 + DAPP_GAS_FEE_HIGH_THRESHOLD, 10),
    );

    // Check if dapp suggested fee is at least 20% higher than market estimation
    const isDappFeeHigh = dappFeeInGwei.greaterThan(threshold);

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
