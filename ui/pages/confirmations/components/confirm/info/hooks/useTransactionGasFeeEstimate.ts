import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  addHexes,
  decGWEIToHexWEI,
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  gasLimit = gasLimit || HEX_ZERO;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  gasPrice = gasPrice || HEX_ZERO;
  const maxPriorityFeePerGas =
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    transactionMeta.txParams?.maxPriorityFeePerGas || HEX_ZERO;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const maxFeePerGas = transactionMeta.txParams?.maxFeePerGas || HEX_ZERO;

  let gasEstimate: Hex;
  if (supportsEIP1559) {
    const estimatedBaseFeeWeiHex = decGWEIToHexWEI(estimatedBaseFee);

    // Minimum Total Fee = (estimatedBaseFee + maxPriorityFeePerGas) * gasLimit
    let minimumFeePerGas = addHexes(
      estimatedBaseFeeWeiHex || HEX_ZERO,
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
