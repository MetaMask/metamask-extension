import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getFromToken,
  getIsSlippageUserOverride,
  getSlippage,
  getToToken,
} from '../../ducks/bridge/selectors';
import { setSlippage } from '../../ducks/bridge/actions';
import { assetIdsMatch } from '../../ducks/bridge/utils';

export function useSmartSlippage(): void {
  const dispatch = useDispatch();
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const slippage = useSelector(getSlippage);
  const isUserOverride = useSelector(getIsSlippageUserOverride);
  const { activeQuote } = useSelector(getBridgeQuotes);
  const quote = activeQuote?.quote;

  useEffect(() => {
    if (
      isUserOverride ||
      slippage !== undefined ||
      quote?.slippage === undefined ||
      !assetIdsMatch(quote.srcAsset.assetId, fromToken?.assetId) ||
      !assetIdsMatch(quote.destAsset.assetId, toToken?.assetId)
    ) {
      return;
    }

    dispatch(setSlippage(quote.slippage));
  }, [
    dispatch,
    fromToken?.assetId,
    isUserOverride,
    quote,
    slippage,
    toToken?.assetId,
  ]);
}
