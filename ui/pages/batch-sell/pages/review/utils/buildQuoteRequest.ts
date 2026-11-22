import BigNumber from 'bignumber.js';
import { formatAddressToCaipReference } from '@metamask/bridge-controller';
import { calcTokenValue } from '../../../../../../shared/lib/swaps-utils';
// eslint-disable-next-line import-x/no-restricted-paths
import { safeAmountForCalc } from '../../../../bridge/utils/quote';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { QuoteRequestParams, SendAssetEntry } from '../types';

/**
 * Converts a human-readable balance + percent into the smallest-unit string
 * the bridge controller expects for `srcTokenAmount`. Returns `undefined` when
 * the asset is missing the data required to compute it.
 *
 * @param asset - The asset to compute the source token amount for.
 * @param sendAmountPercent - The percentage of the asset balance to send (0–100).
 * @returns The source token amount in smallest units, or `undefined` if the
 * asset lacks the required data.
 */
export const buildSrcTokenAmountSmallestUnit = (
  asset: BatchSellAsset,
  sendAmountPercent: number,
): string | undefined => {
  if (!asset.balance || !asset.decimals) {
    return undefined;
  }
  const humanReadableAmount = new BigNumber(safeAmountForCalc(asset.balance))
    .times(String(sendAmountPercent))
    .div(100)
    .toFixed();
  return calcTokenValue(humanReadableAmount, asset.decimals)
    .toFixed()
    .split('.')[0];
};

/**
 * Builds a quote request params object for a single send asset entry.
 *
 * Batch sell is same-chain only, so `destChainId` always mirrors `srcChainId`.
 * Localhost RPCs (forks) report different balances than the bridge-api sees
 * on-chain, so `insufficientBal` is forced to `true` for those to keep quotes
 * flowing.
 *
 * @param options - The options for building the quote request.
 * @param options.entry - The send asset entry containing the asset, percent, and slippage.
 * @param options.destAssetId - The CAIP asset ID of the destination token.
 * @param options.walletAddress - The user's wallet address.
 * @returns A `QuoteRequestParams` object, or `undefined` when the source amount
 * can't be computed (e.g. zero balance), signalling to skip this entry.
 */
export const buildQuoteRequestForEntry = ({
  entry,
  destAssetId,
  walletAddress,
}: {
  entry: SendAssetEntry;
  destAssetId: string;
  walletAddress: string;
}): QuoteRequestParams | undefined => {
  const { asset, sendAmountPercent, slippagePercent } = entry;
  const srcTokenAmount = buildSrcTokenAmountSmallestUnit(
    asset,
    sendAmountPercent,
  );
  if (!srcTokenAmount || srcTokenAmount === '0') {
    return undefined;
  }
  return {
    srcTokenAddress: formatAddressToCaipReference(asset.assetId),
    destTokenAddress: formatAddressToCaipReference(destAssetId),
    srcTokenAmount,
    srcChainId: asset.chainId,
    destChainId: asset.chainId,
    slippage: slippagePercent,
    walletAddress,
  };
};
