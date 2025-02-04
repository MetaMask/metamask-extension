import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getQuoteRequest,
  getToChain,
} from '../../ducks/bridge/selectors';
import { getMarketData, getParticipateInMetaMetrics } from '../../selectors';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
import {
  setDestTokenExchangeRates,
  setDestTokenUsdExchangeRates,
  setSrcTokenExchangeRates,
} from '../../ducks/bridge/bridge';
import { exchangeRateFromMarketData } from '../../ducks/bridge/utils';
import { formatChainIdFromApi } from '../../../shared/modules/bridge-utils/multichain';
import { getMultichainCurrentChainId } from '../../selectors/multichain';

export const useBridgeExchangeRates = () => {
  const { srcTokenAddress, destTokenAddress } = useSelector(getQuoteRequest);
  const { activeQuote } = useSelector(getBridgeQuotes);
  const chainId = useSelector(getMultichainCurrentChainId);
  const toChain = useSelector(getToChain);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);

  const dispatch = useDispatch();

  const currency = useSelector(getCurrentCurrency);

  // Use values from activeQuote if available, otherwise use validated input field values
  const fromTokenAddress = activeQuote
    ? activeQuote.quote.srcAsset.address
    : srcTokenAddress;
  const toTokenAddress = activeQuote
    ? activeQuote.quote.destAsset.address
    : destTokenAddress;
  const fromChainId = activeQuote
    ? formatChainIdFromApi(activeQuote.quote.srcChainId)
    : chainId;
  const toChainId = activeQuote
    ? formatChainIdFromApi(activeQuote.quote.destChainId)
    : toChain?.chainId;

  const marketData = useSelector(getMarketData);

  // Fetch exchange rates for selected src token if not found in marketData
  useEffect(() => {
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
          }),
        );
      }
    }
  }, [fromChainId, fromTokenAddress]);

  // Fetch exchange rates for selected dest token if not found in marketData
  useEffect(() => {
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
          }),
        );
        // If the selected currency is not USD, fetch the USD exchange rate for metrics
        if (isMetaMetricsEnabled && currency !== 'usd') {
          dispatch(
            setDestTokenUsdExchangeRates({
              chainId: toChainId,
              tokenAddress: toTokenAddress,
              currency: 'usd',
            }),
          );
        }
      }
    }
  }, [toChainId, toTokenAddress]);
};
