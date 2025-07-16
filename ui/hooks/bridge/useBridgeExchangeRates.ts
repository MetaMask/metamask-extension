import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getFromToken,
  getQuoteRequest,
  getToChain,
  getToToken,
} from '../../ducks/bridge/selectors';
import { getMarketData, getParticipateInMetaMetrics } from '../../selectors';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
import {
  setDestTokenExchangeRates,
  setDestTokenUsdExchangeRates,
  setSrcTokenExchangeRates,
} from '../../ducks/bridge/bridge';
import { exchangeRateFromMarketData } from '../../ducks/bridge/utils';
import { useMultichainSelector } from '../useMultichainSelector';
import { getMultichainCurrentChainId } from '../../selectors/multichain';

export const useBridgeExchangeRates = () => {
  const { srcTokenAddress, destTokenAddress } = useSelector(getQuoteRequest);
  const { activeQuote } = useSelector(getBridgeQuotes);
  const fromChainId = useMultichainSelector(getMultichainCurrentChainId);
  const toChain = useSelector(getToChain);
  const toChainId = toChain?.chainId;

  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);

  const dispatch = useDispatch();

  const currency = useSelector(getCurrentCurrency);

  // Only use token address from quote as a fallback if there is no token address in the store
  const fromTokenAddressFromQuote = activeQuote
    ? activeQuote.quote.srcAsset.address
    : srcTokenAddress;
  const fromTokenFromStore = useSelector(getFromToken);
  const fromTokenAddress =
    fromTokenFromStore?.address ?? fromTokenAddressFromQuote;

  // Only use token address from quote as a fallback if there is no token address in the store
  const toTokenAddressFromQuote = activeQuote
    ? activeQuote.quote.destAsset.address
    : destTokenAddress;
  const toTokenFromStore = useSelector(getToToken);
  const toTokenAddress = toTokenFromStore?.address ?? toTokenAddressFromQuote;

  const marketData = useSelector(getMarketData);

  const abortController = useRef(new AbortController());
  // Fetch exchange rates for selected src token if not found in marketData
  useEffect(() => {
    abortController.current.abort();
    abortController.current = new AbortController();
    if (fromChainId && fromTokenAddress) {
      const exchangeRate = exchangeRateFromMarketData(
        fromChainId,
        fromTokenAddress,
        marketData,
      );

      if (!exchangeRate) {
        dispatch(
          setSrcTokenExchangeRates({
            chainId: fromChainId,
            tokenAddress: fromTokenAddress,
            currency,
            signal: abortController.current.signal,
          }),
        );
      }
    }
  }, [currency, dispatch, fromChainId, fromTokenAddress, marketData]);

  // Fetch exchange rates for selected dest token if not found in marketData
  useEffect(() => {
    abortController.current.abort();
    abortController.current = new AbortController();
    if (toChainId && toTokenAddress) {
      const exchangeRate = exchangeRateFromMarketData(
        toChainId,
        toTokenAddress,
        marketData,
      );

      if (!exchangeRate) {
        dispatch(
          setDestTokenExchangeRates({
            chainId: toChainId,
            tokenAddress: toTokenAddress,
            currency,
            signal: abortController.current.signal,
          }),
        );
        // If the selected currency is not USD, fetch the USD exchange rate for metrics
        if (isMetaMetricsEnabled && currency !== 'usd') {
          dispatch(
            setDestTokenUsdExchangeRates({
              chainId: toChainId,
              tokenAddress: toTokenAddress,
              currency: 'usd',
              signal: abortController.current.signal,
            }),
          );
        }
      }
    }
  }, [
    currency,
    dispatch,
    isMetaMetricsEnabled,
    marketData,
    toChainId,
    toTokenAddress,
  ]);
};
