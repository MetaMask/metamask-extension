import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { CaipChainId } from '@metamask/utils';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { getNativeAssetForChain } from '../../../../../ducks/batch-sell/selectors';
import { type BridgeAppState } from '../../../../../ducks/bridge/selectors';
import { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';

type Args = {
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'];
  quotes?: BatchSellQuotesResults['quotes'];
  totalNetworkFee?: number;
};

export type BatchSellValidationResult = {
  isNoQuotesAvailable: boolean;
  isInsufficientGasForFee: boolean;
  nativeAssetSymbol: string | undefined;
};

export const useBatchSellValidation = ({
  sendAssetsConfig,
  quotes,
  totalNetworkFee,
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
    if (totalNetworkFee === undefined || !nativeAsset) {
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

    return remainingNativeBalance.lt(totalNetworkFee.toString());
  }, [totalNetworkFee, nativeAsset, sendAssetEntries]);

  return {
    isNoQuotesAvailable,
    isInsufficientGasForFee,
    nativeAssetSymbol: nativeAsset?.symbol,
  };
};
