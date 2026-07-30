import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getFromToken } from '../../ducks/bridge/selectors';
import { getMarketData } from '../../selectors';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
import { setSrcTokenExchangeRates } from '../../ducks/bridge/bridge';
import { useDispatch } from '../../store/hooks';

export const useBridgeExchangeRates = () => {
  const dispatch = useDispatch();
  const currency = useSelector(getCurrentCurrency);

  const fromToken = useSelector(getFromToken);

  const marketData = useSelector(getMarketData);

  const fromAbortController = useRef<AbortController | null>(
    new AbortController(),
  );

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
    if (fromToken) {
      dispatch(
        setSrcTokenExchangeRates({
          assetId: fromToken.assetId,
          currency,
          signal: fromAbortController.current.signal,
        }),
      );
    }
  }, [currency, dispatch, fromToken]);
};
