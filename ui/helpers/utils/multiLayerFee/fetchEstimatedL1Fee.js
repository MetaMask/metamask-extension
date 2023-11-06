import BigNumber from 'bignumber.js';

import { isOpStack, isScroll } from './networks';
import fetchEstimatedL1FeeOptimism from './optimism/fetchEstimatedL1Fee';
import fetchEstimatedL1FeeScroll from './scroll/fetchEstimatedL1Fee';

/**
 * @param chainId - The id of the chain we're calculating the L1 fee for
 * @param txMeta - Metadata of the transaction
 * @param txMeta.txParams - Raw tx data
 * @param ethersProvider - Ethers provider used for interacting with the Oracles
 */
export default async function fetchEstimatedL1Fee(
  chainId,
  txMeta,
  ethersProvider,
) {
  const params = [chainId, txMeta, ethersProvider];

  if (isOpStack(chainId)) {
    return await fetchEstimatedL1FeeOptimism(...params);
  } else if (isScroll(chainId)) {
    return await fetchEstimatedL1FeeScroll(...params);
  }

  return new BigNumber(0).toHexString();
}
