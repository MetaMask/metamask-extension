import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFromToken } from '../../ducks/bridge/selectors';
import { getMarketData } from '../../selectors';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
import { setSrcTokenExchangeRates } from '../../ducks/bridge/bridge';
import { exchangeRateFromMarketData } from '../../ducks/bridge/utils';
import { useMultichainSelector } from '../useMultichainSelector';
import { getMultichainCurrentChainId } from '../../selectors/multichain';

export const useBridgeExchangeRates = () => {
  const fromChainId = useMultichainSelector(getMultichainCurrentChainId);

  const dispatch = useDispatch();
  const currency = useSelector(getCurrentCurrency);

  const fromToken = useSelector(getFromToken);

  const marketData = useSelector(getMarketData);

  const fromAbortController = useRef<AbortController | null>(
    new AbortController(),
  );

  const cachedFromTokenExchangeRate = fromToken
    ? exchangeRateFromMarketData(fromToken.assetId, marketData)
    : undefined;

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      fromAbortController.current?.abort();
      fromAbortController.current = null;
    };
  }, []);

  // Fetch exchange rates for selected src token if not found in marketData
  useEffect(() => {
    fromAbortController.current?.abort();
    fromAbortController.current = new AbortController();
    if (fromToken && !cachedFromTokenExchangeRate) {
      dispatch(
        setSrcTokenExchangeRates({
          assetId: fromToken.assetId,
          currency,
          signal: fromAbortController.current.signal,
        }),
      );
    }
  }, [currency, dispatch, fromToken, fromChainId, cachedFromTokenExchangeRate]);
};
