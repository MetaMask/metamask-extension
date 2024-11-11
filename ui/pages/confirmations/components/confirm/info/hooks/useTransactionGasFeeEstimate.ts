import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { PriorityLevels } from '../../../../../../../shared/constants/gas';
import {
  addHexes,
  multiplyHexes,
} from '../../../../../../../shared/modules/conversion.utils';
import { Numeric } from '../../../../../../../shared/modules/Numeric';
import { useGasFeeEstimates } from '../../../../../../hooks/useGasFeeEstimates';
import { HEX_ZERO } from '../shared/constants';

export function useTransactionGasFeeEstimate(
  transactionMeta: TransactionMeta,
  supportsEIP1559: boolean,
): Hex {
  let { gas: gasLimit, gasPrice } = transactionMeta.txParams;

  const { gasFeeEstimates } = useGasFeeEstimates(
    transactionMeta.networkClientId,
  );
  const estimatedBaseFee = (gasFeeEstimates as GasFeeEstimates)
    ?.estimatedBaseFee;

  // override with values from `dappSuggestedGasFees` if they exist
  gasLimit =
    (transactionMeta.userFeeLevel === PriorityLevels.dAppSuggested
      ? transactionMeta.dappSuggestedGasFees?.gas
      : gasLimit) || HEX_ZERO;
  gasPrice =
    (transactionMeta.userFeeLevel === PriorityLevels.dAppSuggested
      ? transactionMeta.dappSuggestedGasFees?.gasPrice
      : gasPrice) || HEX_ZERO;
  const maxPriorityFeePerGas =
    (transactionMeta.userFeeLevel === PriorityLevels.dAppSuggested
      ? transactionMeta.dappSuggestedGasFees?.maxPriorityFeePerGas
      : transactionMeta.txParams?.maxPriorityFeePerGas) || HEX_ZERO;
  const maxFeePerGas =
    (transactionMeta.userFeeLevel === PriorityLevels.dAppSuggested
      ? transactionMeta.dappSuggestedGasFees?.maxFeePerGas
      : transactionMeta.txParams?.maxFeePerGas) || HEX_ZERO;

  let gasEstimate: Hex;
  if (supportsEIP1559) {
    // Minimum Total Fee = (estimatedBaseFee + maxPriorityFeePerGas) * gasLimit
    let minimumFeePerGas = addHexes(
      estimatedBaseFee || HEX_ZERO,
      maxPriorityFeePerGas,
    );

    // `minimumFeePerGas` should never be higher than the `maxFeePerGas`
    if (new Numeric(minimumFeePerGas, 16).greaterThan(maxFeePerGas, 16)) {
      minimumFeePerGas = maxFeePerGas;
    }

    gasEstimate = multiplyHexes(minimumFeePerGas as Hex, gasLimit as Hex);
  } else {
    gasEstimate = multiplyHexes(gasPrice as Hex, gasLimit as Hex);
  }

  return gasEstimate;
}
