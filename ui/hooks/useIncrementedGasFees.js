import { addHexPrefix } from 'ethereumjs-util';
import { useMemo } from 'react';
import { multiplyCurrencies } from '../../shared/modules/conversion.utils';
import { isEIP1559Transaction } from '../../shared/modules/transaction.utils';

/**
 * Simple helper to save on duplication to multiply the supplied wei hex string
 * by 1.10 to get bare minimum new gas fee.
 *
 * @param {string} hexStringValue - hex value in wei to be incremented
 * @returns {string} - hex value in WEI 10% higher than the param.
 */
function addTenPercent(hexStringValue) {
  return addHexPrefix(
    multiplyCurrencies(hexStringValue, 1.1, {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 10,
    }),
  );
}

/**
 * When initializing cancellations or speed ups we need to set the baseline
 * gas fees to be 10% higher, which is the bare minimum that the network will
 * accept for transactions of the same nonce. Anything lower than this will be
 * discarded by the network to avoid DoS attacks. This hook returns an object
 * that either has gasPrice or maxFeePerGas/maxPriorityFeePerGas specified. In
 * addition the gasLimit will also be included.
 * @param {} transactionGroup
 * @returns {import(
 *   '../../app/scripts/controllers/transactions'
 * ).CustomGasSettings} - Gas settings for cancellations/speed ups
 */
export function useIncrementedGasFees(transactionGroup) {
  const { primaryTransaction } = transactionGroup;

  // We memoize this value so that it can be relied upon in other hooks.
  const customGasSettings = useMemo(() => {
    // This hook is called indiscriminantly on all transactions appearing in
    // the activity list. This includes transitional items such as signature
    // requests. These types of "transactions" are not really transactions and
    // do not have txParams. This is why we use optional chaining on the
    // txParams object in this hook.
    const temporaryGasSettings = {
      gasLimit: primaryTransaction.txParams?.gas,
    };
    if (isEIP1559Transaction(primaryTransaction)) {
      const transactionMaxFeePerGas = primaryTransaction.txParams?.maxFeePerGas;
      const transactionMaxPriorityFeePerGas =
        primaryTransaction.txParams?.maxPriorityFeePerGas;
      temporaryGasSettings.maxFeePerGas =
        transactionMaxFeePerGas === undefined ||
        transactionMaxFeePerGas.startsWith('-')
          ? '0x0'
          : addTenPercent(transactionMaxFeePerGas);
      temporaryGasSettings.maxPriorityFeePerGas =
        transactionMaxPriorityFeePerGas === undefined ||
        transactionMaxPriorityFeePerGas.startsWith('-')
          ? '0x0'
          : addTenPercent(transactionMaxPriorityFeePerGas);
    } else {
      const transactionGasPrice = primaryTransaction.txParams?.gasPrice;
      temporaryGasSettings.gasPrice =
        transactionGasPrice === undefined || transactionGasPrice.startsWith('-')
          ? '0x0'
          : addTenPercent(transactionGasPrice);
    }
    return temporaryGasSettings;
  }, [primaryTransaction]);

  return customGasSettings;
}
