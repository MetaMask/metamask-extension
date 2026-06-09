import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { CaipChainId } from '@metamask/utils';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { getNativeAssetForChain } from '../../../../../ducks/batch-sell/selectors';
import { type BridgeAppState } from '../../../../../ducks/bridge/selectors';
import {
  BatchSellQuotesConfig,
  BatchSellQuotesResults,
  BatchSellValidationResult,
} from '../types';

type Args = {
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'];
  quotes?: BatchSellQuotesResults['quotes'];
  totalNetworkFee?: string | number;
  feeAssetId?: string;
  isLoadingFees?: boolean;
};

export const useBatchSellAggregateValidation = ({
  sendAssetsConfig,
  quotes,
  totalNetworkFee,
  feeAssetId,
  isLoadingFees,
}: Args): BatchSellValidationResult => {
  const sendAssetEntries = useMemo(
    () => Object.values(sendAssetsConfig),
    [sendAssetsConfig],
  );

  const sourceChainId: CaipChainId | undefined =
    sendAssetEntries[0]?.asset.chainId;

  const nativeAsset = useSelector((state: BridgeAppState) =>
    getNativeAssetForChain(state, sourceChainId ?? null),
  );

  const isNoQuotesAvailable = useMemo(() => {
    if (!quotes) {
      return false;
    }
    const quoteValues = Object.values(quotes);
    if (quoteValues.length === 0) {
      return false;
    }
    return quoteValues.every((q) => !q.hasQuote);
  }, [quotes]);

  const isInsufficientGasForFee = useMemo(() => {
    if (totalNetworkFee === undefined) {
      // Fees are still being fetched — do not block the user yet.
      if (isLoadingFees) {
        return false;
      }
      // Fees finished loading but no value was returned, meaning the fee
      // estimate could not be retrieved. Treat this as insufficient gas so
      // the UI can surface an appropriate error.
      return true;
    }

    if (!nativeAsset) {
      return false;
    }

    // When the fee is charged in a non-native token (e.g. USDC for STX 7702
    // batch transactions on Polygon), it is deducted from the swap output —
    // the user does not need to hold native gas for it. Comparing the fee
    // amount against the native balance in this case would produce a false
    // "Insufficient funds" error, so we skip the check entirely.
    const nativeAssetId = getNativeAssetForChainId(sourceChainId)?.assetId;
    const feeIsNative =
      !feeAssetId || feeAssetId.toLowerCase() === nativeAssetId?.toLowerCase();

    if (!feeIsNative) {
      return false;
    }

    // If the user is selling the native asset, subtract the amount they're
    // sending so we compare the fee against what would actually remain.
    // Note: BigNumber rejects raw numbers with > 15 significant digits, so all
    // numeric inputs are stringified before being passed in.
    const nativeBeingSentEntry = sendAssetEntries.find(
      ({ asset }) =>
        getNativeAssetForChainId(asset.chainId)?.assetId.toLowerCase() ===
        asset.assetId.toLowerCase(),
    );
    const nativeBeingSent = nativeBeingSentEntry
      ? new BigNumber(nativeBeingSentEntry.asset.balance || '0').times(
          new BigNumber(nativeBeingSentEntry.sendAmountPercent.toString()).div(
            100,
          ),
        )
      : new BigNumber(0);

    const remainingNativeBalance = new BigNumber(
      nativeAsset.balance || '0',
    ).minus(nativeBeingSent);

    return remainingNativeBalance.lt(new BigNumber(totalNetworkFee.toString()));
  }, [
    totalNetworkFee,
    isLoadingFees,
    feeAssetId,
    nativeAsset,
    sourceChainId,
    sendAssetEntries,
  ]);

  return {
    isNoQuotesAvailable,
    isInsufficientGasForFee,
    nativeAssetSymbol: nativeAsset?.symbol,
  };
};
