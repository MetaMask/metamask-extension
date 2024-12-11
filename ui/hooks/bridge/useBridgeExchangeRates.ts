import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getQuoteRequest,
  getToChain,
} from '../../ducks/bridge/selectors';
import { getCurrentCurrency, getMarketData } from '../../selectors';
import { decimalToPrefixedHex } from '../../../shared/modules/conversion.utils';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import {
  setDestTokenExchangeRates,
  setSrcTokenExchangeRates,
} from '../../ducks/bridge/bridge';
import { exchangeRateFromMarketData } from '../../ducks/bridge/utils';

export const useBridgeExchangeRates = () => {
  const { srcTokenAddress, destTokenAddress } = useSelector(getQuoteRequest);
  const { activeQuote } = useSelector(getBridgeQuotes);
  const chainId = useSelector(getCurrentChainId);
  const toChain = useSelector(getToChain);

  const dispatch = useDispatch();

  const currency = useSelector(getCurrentCurrency);

  // Use values from activeQuote if available, otherwise use validated input field values
  const fromTokenAddress = (
    activeQuote ? activeQuote.quote.srcAsset.address : srcTokenAddress
  )?.toLowerCase();
  const toTokenAddress = (
    activeQuote ? activeQuote.quote.destAsset.address : destTokenAddress
  )?.toLowerCase();
  const fromChainId = activeQuote
    ? decimalToPrefixedHex(activeQuote.quote.srcChainId)
    : chainId;
  const toChainId = activeQuote
    ? decimalToPrefixedHex(activeQuote.quote.destChainId)
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
      }
    }
  }, [toChainId, toTokenAddress]);
};
