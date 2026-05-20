import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { debounce } from 'lodash';
import { updateBatchSellTrades } from '../../../../../ducks/bridge/actions';
import {
  BatchSellQuotesControllerResult,
  BatchSellQuotesResults,
  SendAssetEntry,
} from '../types';
import { TRADES_REQUEST_DEBOUNCE_MS } from '../../../../../constants/batch-sell';

export const useBatchSellTradesFetching = (
  {
    data,
    entries,
    quotesLastFetchedMs,
  }: {
    data: BatchSellQuotesResults | undefined;
    entries: SendAssetEntry[];
    quotesLastFetchedMs: BatchSellQuotesControllerResult['quotesLastFetchedMs'];
  },
  { enabled }: { enabled: boolean },
) => {
  const dispatch = useDispatch();
  const latestArgsRef = useRef({ data, entries });
  latestArgsRef.current = { data, entries };

  const debouncedDispatch = useRef(
    debounce((quotes) => {
      dispatch(updateBatchSellTrades(quotes));
    }, TRADES_REQUEST_DEBOUNCE_MS),
  );

  useEffect(() => {
    if (!enabled || !quotesLastFetchedMs) {
      return;
    }

    const { data: latestData, entries: latestEntries } = latestArgsRef.current;
    const quotes = latestEntries
      .filter(({ enabled }) => enabled)
      .map((entry) => latestData?.quotes[entry.assetId]?.quote ?? null);
    if (!quotes.some((quote) => quote !== null)) {
      return;
    }

    debouncedDispatch.current(quotes);
  }, [enabled, quotesLastFetchedMs]);

  useEffect(() => {
    const debounced = debouncedDispatch.current;
    return () => {
      debounced.cancel();
    };
  }, []);
};
