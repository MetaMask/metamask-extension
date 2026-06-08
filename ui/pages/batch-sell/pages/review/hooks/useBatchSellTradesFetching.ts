import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { debounce } from 'lodash';
import {
  BatchSellQuotesControllerResult,
  BatchSellQuotesResults,
  SendAssetEntry,
} from '../types';
import { TRADES_REQUEST_DEBOUNCE_MS } from '../../../../../constants/batch-sell';
import { updateBatchSellTrades } from '../../../../../ducks/batch-sell/actions';

export const useBatchSellTradesFetching = (
  {
    data,
    entries,
    quotesLastFetchedMs,
    chain,
  }: {
    data: BatchSellQuotesResults | undefined;
    entries: SendAssetEntry[];
    quotesLastFetchedMs: BatchSellQuotesControllerResult['quotesLastFetchedMs'];
    chain: string;
  },
  { enabled }: { enabled: boolean },
) => {
  const dispatch = useDispatch();
  const latestArgsRef = useRef({ data, entries, chain });
  latestArgsRef.current = { data, entries, chain };

  const debouncedDispatch = useRef(
    debounce((quotes, chainId: string) => {
      dispatch(updateBatchSellTrades(quotes, chainId));
    }, TRADES_REQUEST_DEBOUNCE_MS),
  );

  useEffect(() => {
    if (!enabled || !quotesLastFetchedMs) {
      return;
    }

    const {
      data: latestData,
      entries: latestEntries,
      chain: latestChain,
    } = latestArgsRef.current;

    const quotes = latestEntries
      .filter((entry) => entry.enabled)
      .map((entry) => latestData?.quotes[entry.assetId]?.quote ?? null);

    if (!quotes.some((quote) => quote !== null)) {
      return;
    }

    debouncedDispatch.current(quotes, latestChain);
  }, [enabled, quotesLastFetchedMs]);

  useEffect(() => {
    const debounced = debouncedDispatch.current;
    return () => {
      debounced.cancel();
    };
  }, []);
};
