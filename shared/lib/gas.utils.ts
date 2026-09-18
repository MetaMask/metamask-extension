import { Numeric } from './Numeric';

type GetMaximumGasTotalInHexWeiOptions = {
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
};

type GetMinimumGasTotalInHexWeiOptions = {
  gasLimitNoBuffer?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  baseFeePerGas?: string;
};

/**
 * Accepts an options bag containing gas fee parameters in hex format and
 * returns a gasTotal parameter representing the maximum amount of wei the
 * transaction will cost.
 *
 * @param options - gas fee parameters object
 * @param options.gasLimit - the maximum amount of gas to allow this
 * transaction to consume. Value is a hex string
 * @param options.gasPrice - The fee in wei to pay per gas used.
 * gasPrice is only set on Legacy type transactions. Value is hex string
 * @param options.maxFeePerGas - The maximum fee in wei to pay per
 * gas used. maxFeePerGas is introduced in EIP 1559 and represents the max
 * total a user will pay per gas. Actual cost is determined by baseFeePerGas
 * on the block + maxPriorityFeePerGas. Value is hex string
 * @returns The maximum total cost of transaction in hex wei string
 */
export function getMaximumGasTotalInHexWei({
  gasLimit = '0x0',
  gasPrice,
  maxFeePerGas,
}: GetMaximumGasTotalInHexWeiOptions = {}): string {
  if (maxFeePerGas) {
    return new Numeric(gasLimit, 16)
      .times(new Numeric(maxFeePerGas, 16))
      .toPrefixedHexString();
  }
  if (!gasPrice) {
    throw new Error(
      'getMaximumGasTotalInHexWei requires gasPrice be provided to calculate legacy gas total',
    );
  }

  return new Numeric(gasLimit, 16)
    .times(new Numeric(gasPrice, 16))
    .toPrefixedHexString();
}

/**
 * Accepts an options bag containing gas fee parameters in hex format and
 * returns a gasTotal parameter representing the minimum amount of wei the
 * transaction will cost. For gasPrice types this is the same as max.
 *
 * @param options - gas fee parameters object
 * @param options.gasLimitNoBuffer - gas limit without buffer
 * @param options.gasPrice - The fee in wei to pay per gas used.
 * gasPrice is only set on Legacy type transactions. Value is hex string
 * @param options.maxFeePerGas - The maximum fee in wei to pay per
 * gas used. maxFeePerGas is introduced in EIP 1559 and represents the max
 * total a user will pay per gas. Actual cost is determined by baseFeePerGas
 * on the block + maxPriorityFeePerGas. Value is hex string
 * @param options.maxPriorityFeePerGas - The maximum fee in wei to
 * pay a miner to include this transaction.
 * @param options.baseFeePerGas - The estimated block baseFeePerGas
 * that will be burned. Introduced in EIP 1559. Value in hex wei.
 * @returns The minimum total cost of transaction in hex wei string
 */
export function getMinimumGasTotalInHexWei({
  gasLimitNoBuffer = '0x0',
  gasPrice,
  maxPriorityFeePerGas,
  maxFeePerGas,
  baseFeePerGas,
}: GetMinimumGasTotalInHexWeiOptions = {}): string {
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
    return getMaximumGasTotalInHexWei({
      gasLimit: gasLimitNoBuffer,
      gasPrice,
    });
  }
  // baseFeePerGas, maxPriorityFeePerGas, and maxFeePerGas are guaranteed to
  // be defined here due to the validation checks above.
  const minimumFeePerGas = new Numeric(baseFeePerGas as string, 16)
    .add(new Numeric(maxPriorityFeePerGas as string, 16))
    .toString();

  if (
    new Numeric(minimumFeePerGas, 16).greaterThan(maxFeePerGas as string, 16)
  ) {
    return getMaximumGasTotalInHexWei({
      gasLimit: gasLimitNoBuffer,
      maxFeePerGas,
    });
  }
  return new Numeric(gasLimitNoBuffer, 16)
    .times(new Numeric(minimumFeePerGas, 16))
    .toPrefixedHexString();
}
