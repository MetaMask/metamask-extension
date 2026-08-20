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
};

export const useBatchSellAggregateValidation = ({
  sendAssetsConfig,
  quotes,
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

  return {
    isNoQuotesAvailable,
    nativeAssetSymbol: nativeAsset?.symbol,
  };
};
