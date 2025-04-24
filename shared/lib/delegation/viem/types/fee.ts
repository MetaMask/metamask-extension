import type { OneOf } from './utils';

export type FeeHistory<quantity = bigint> = {
  /**
   * An array of block base fees per gas (in wei). This includes the next block after
   * the newest of the returned range, because this value can be derived from the newest block.
   * Zeroes are returned for pre-EIP-1559 blocks. */
  baseFeePerGas: quantity[];
  /** An array of block gas used ratios. These are calculated as the ratio of gasUsed and gasLimit. */
  gasUsedRatio: number[];
  /** Lowest number block of the returned range. */
  oldestBlock: quantity;
  /** An array of effective priority fees (in wei) per gas data points from a single block. All zeroes are returned if the block is empty. */
  reward?: quantity[][] | undefined;
};

export type FeeValuesLegacy<quantity = bigint> = {
  /** Base fee per gas. */
  gasPrice: quantity;
  maxFeePerBlobGas?: undefined;
  maxFeePerGas?: undefined;
  maxPriorityFeePerGas?: undefined;
};

export type FeeValuesEIP1559<quantity = bigint> = {
  gasPrice?: undefined;
  maxFeePerBlobGas?: undefined;
  /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
  maxFeePerGas: quantity;
  /** Max priority fee per gas (in wei). */
  maxPriorityFeePerGas: quantity;
};

export type FeeValuesEIP4844<quantity = bigint> = {
  gasPrice?: undefined;
  /** Maximum total fee per gas sender is willing to pay for blob gas (in wei). */
  maxFeePerBlobGas: quantity;
  /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
  maxFeePerGas: quantity;
  /** Max priority fee per gas (in wei). */
  maxPriorityFeePerGas: quantity;
};

export type FeeValues<quantity = bigint> = OneOf<
  | FeeValuesLegacy<quantity>
  | FeeValuesEIP1559<quantity>
  | FeeValuesEIP4844<quantity>
>;

export type FeeValuesType = 'legacy' | 'eip1559' | 'eip4844';
