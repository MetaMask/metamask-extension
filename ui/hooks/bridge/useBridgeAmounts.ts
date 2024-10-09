import { shallowEqual, useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getToChain,
  getToToken,
} from '../../ducks/bridge/selectors';
import { useMemo } from 'react';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { fetchTokenExchangeRates } from '../../helpers/utils/util';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../../shared/constants/network';
import { zeroAddress } from '../../__mocks__/ethereumjs-util';
import BigNumber from 'bignumber.js';
import { getConversionRate } from '../../ducks/metamask/metamask';
import { getTokenExchangeRates } from '../../selectors';
import { getRelayerFee, getTotalGasFee } from '../../pages/bridge/utils/quote';
import { toChecksumAddress } from 'ethereumjs-util';
import { isEqual } from 'lodash';
import { useAsyncResult } from '../useAsyncResult';

interface BridgeQuoteAmount {
  raw: BigNumber;
  fiat: BigNumber | null;
}

// Returns fees and amounts for the quotes
const useBridgeAmounts = () => {
  const { quotes } = useSelector(getBridgeQuotes);
  const toChain = useSelector(getToChain, isEqual);
  const toToken = useSelector(getToToken, isEqual);
  // Returns fromToken to src native asset exchange rate
  const fromTokenExchangeRates: Record<string, number> = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const fromNativeExchangeRate = useSelector(getConversionRate);

  // TODO move this elsewhere to avoid duplicate spot-prices calls
  // Fetch toToken to dest native asset exchange rates
  const { value } = useAsyncResult<{
    toTokenExchangeRate: number | undefined;
    toNativeExchangeRate: number;
  }>(async () => {
    if (toChain?.chainId && toToken?.address) {
      return await fetchTokenExchangeRates(
        CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
          toChain.chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
        ],
        [toToken.address],
        toChain.chainId,
      ).then((exchangeRates) => {
        return {
          toTokenExchangeRate:
            toToken.address !== zeroAddress()
              ? exchangeRates?.[toChecksumAddress(toToken.address)]
              : 1,
          toNativeExchangeRate: exchangeRates?.[zeroAddress()] ?? 1,
        };
      });
    }

    return await { toTokenExchangeRate: undefined, toNativeExchangeRate: 1 };
  }, [toChain, toToken]);
  const { toTokenExchangeRate, toNativeExchangeRate } = value ?? {};

  const toAmounts: Record<string, BridgeQuoteAmount> = useMemo(() => {
    return quotes.reduce((acc, quote) => {
      const normalizedDestAmount = calcTokenAmount(
        quote.quote.destTokenAmount,
        quote.quote.destAsset.decimals,
      );
      acc[quote.quote.requestId] = {
        raw: normalizedDestAmount,
        fiat:
          toTokenExchangeRate && toNativeExchangeRate
            ? normalizedDestAmount
                .mul(toTokenExchangeRate.toString())
                .mul(toNativeExchangeRate.toString())
            : null,
      };
      return acc;
    }, {} as Record<string, BridgeQuoteAmount>);
  }, [toTokenExchangeRate, toNativeExchangeRate, quotes]);

  const fromAmounts: Record<string, BridgeQuoteAmount> = useMemo(() => {
    return quotes.reduce(
      (acc, { quote: { requestId, srcTokenAmount, srcAsset } }) => {
        const normalizedTokenAmount = calcTokenAmount(
          srcTokenAmount,
          srcAsset.decimals,
        );
        acc[requestId] = {
          raw: normalizedTokenAmount,
          fiat:
            fromTokenExchangeRates?.[srcAsset.symbol] && fromNativeExchangeRate
              ? normalizedTokenAmount
                  .mul(fromTokenExchangeRates[srcAsset.address].toString())
                  .mul(fromNativeExchangeRate.toString())
              : null,
        };
        return acc;
      },
      {} as Record<string, BridgeQuoteAmount>,
    );
  }, [fromTokenExchangeRates, fromNativeExchangeRate, quotes]);

  const gasFees: Record<string, BridgeQuoteAmount> = useMemo(() => {
    return quotes.reduce((acc, quote) => {
      const gasFee = getTotalGasFee(quote, fromNativeExchangeRate);
      acc[quote.quote.requestId] = gasFee;
      return acc;
    }, {} as Record<string, BridgeQuoteAmount>);
  }, [quotes, fromNativeExchangeRate]);

  const relayerFees: Record<string, BridgeQuoteAmount> = useMemo(() => {
    return quotes.reduce((acc, quote) => {
      const relayerFee = getRelayerFee(quote, fromNativeExchangeRate);
      acc[quote.quote.requestId] = relayerFee;
      return acc;
    }, {} as Record<string, BridgeQuoteAmount>);
  }, [quotes, fromNativeExchangeRate]);

  const swapRates = useMemo(() => {
    return quotes.reduce(
      (acc, { quote: { requestId, srcAsset, destAsset } }) => {
        acc[requestId] = `1 ${srcAsset.symbol} = ${toAmounts[requestId].raw
          .div(fromAmounts[requestId].raw)
          .toFixed(4)} ${destAsset.symbol}`;
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [fromAmounts, toAmounts]);

  return {
    toAmounts,
    gasFees,
    relayerFees,
    swapRates,
  };
};

export default useBridgeAmounts;
