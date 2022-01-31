import { addHexPrefix } from 'ethereumjs-util';
import {
  addCurrencies,
  conversionGreaterThan,
  multiplyCurrencies,
} from './conversion.utils';

/**
 * Accepts an options bag containing gas fee parameters in hex format and
 * returns a gasTotal parameter representing the maximum amount of wei the
 * transaction will cost.
 *
 * @param {object} options - gas fee parameters object
 * @param {string} [options.gasLimit] - the maximum amount of gas to allow this
 *  transaction to consume. Value is a hex string
 * @param {string} [options.gasPrice] - The fee in wei to pay per gas used.
 *  gasPrice is only set on Legacy type transactions. Value is hex string
 * @param {string} [options.maxFeePerGas] - The maximum fee in wei to pay per
 *  gas used. maxFeePerGas is introduced in EIP 1559 and represents the max
 *  total a user will pay per gas. Actual cost is determined by baseFeePerGas
 *  on the block + maxPriorityFeePerGas. Value is hex string
 * @returns {string} The maximum total cost of transaction in hex wei string
 */
export function getMaximumGasTotalInHexWei({
  gasLimit = '0x0',
  gasPrice,
  maxFeePerGas,
} = {}) {
  if (maxFeePerGas) {
    return addHexPrefix(
      multiplyCurrencies(gasLimit, maxFeePerGas, {
        toNumericBase: 'hex',
        multiplicandBase: 16,
        multiplierBase: 16,
      }),
    );
  }
  if (!gasPrice) {
    throw new Error(
      'getMaximumGasTotalInHexWei requires gasPrice be provided to calculate legacy gas total',
    );
  }
  return addHexPrefix(
    multiplyCurrencies(gasLimit, gasPrice, {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 16,
    }),
  );
}

/**
 * Accepts an options bag containing gas fee parameters in hex format and
 * returns a gasTotal parameter representing the minimum amount of wei the
 * transaction will cost. For gasPrice types this is the same as max.
 *
 * @param {object} options - gas fee parameters object
 * @param {string} [options.gasLimit] - the maximum amount of gas to allow this
 *  transaction to consume. Value is a hex string
 * @param {string} [options.gasPrice] - The fee in wei to pay per gas used.
 *  gasPrice is only set on Legacy type transactions. Value is hex string
 * @param {string} [options.maxFeePerGas] - The maximum fee in wei to pay per
 *  gas used. maxFeePerGas is introduced in EIP 1559 and represents the max
 *  total a user will pay per gas. Actual cost is determined by baseFeePerGas
 *  on the block + maxPriorityFeePerGas. Value is hex string
 * @param {string} [options.maxPriorityFeePerGas] - The maximum fee in wei to
 *  pay a miner to include this transaction.
 * @param {string} [options.baseFeePerGas] - The estimated block baseFeePerGas
 *  that will be burned. Introduced in EIP 1559. Value in hex wei.
 * @returns {string} The minimum total cost of transaction in hex wei string
 */
export function getMinimumGasTotalInHexWei({
  gasLimit = '0x0',
  gasPrice,
  maxPriorityFeePerGas,
  maxFeePerGas,
  baseFeePerGas,
} = {}) {
  const isEIP1559Estimate = Boolean(
    maxFeePerGas || maxPriorityFeePerGas || baseFeePerGas,
  );
  if (isEIP1559Estimate && gasPrice) {
    throw new Error(
      `getMinimumGasTotalInHexWei expects either gasPrice OR the EIP-1559 gas fields, but both were provided`,
    );
  }

  if (isEIP1559Estimate === false && !gasPrice) {
    throw new Error(
      `getMinimumGasTotalInHexWei expects either gasPrice OR the EIP-1559 gas fields, but neither were provided`,
    );
  }

  if (isEIP1559Estimate && !baseFeePerGas) {
    throw new Error(
      `getMinimumGasTotalInHexWei requires baseFeePerGas be provided when calculating EIP-1559 totals`,
    );
  }

  if (isEIP1559Estimate && (!maxFeePerGas || !maxPriorityFeePerGas)) {
    throw new Error(
      `getMinimumGasTotalInHexWei requires maxFeePerGas and maxPriorityFeePerGas be provided when calculating EIP-1559 totals`,
    );
  }
  if (isEIP1559Estimate === false) {
    return getMaximumGasTotalInHexWei({ gasLimit, gasPrice });
  }
  const minimumFeePerGas = addCurrencies(baseFeePerGas, maxPriorityFeePerGas, {
    toNumericBase: 'hex',
    aBase: 16,
    bBase: 16,
  });

  if (
    conversionGreaterThan(
      { value: minimumFeePerGas, fromNumericBase: 'hex' },
      { value: maxFeePerGas, fromNumericBase: 'hex' },
    )
  ) {
    return getMaximumGasTotalInHexWei({ gasLimit, maxFeePerGas });
  }
  return addHexPrefix(
    multiplyCurrencies(gasLimit, minimumFeePerGas, {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 16,
    }),
  );
}
