import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { CaipAssetType } from '@metamask/utils';
import {
  resetBridgeController,
  setSelectedQuote,
  updateQuoteRequestParams,
} from '../../../../../ducks/bridge/actions';
import {
  type BridgeAppState,
  getFromAccount,
  getIsStxEnabled,
} from '../../../../../ducks/bridge/selectors';
import {
  BatchSellQuotesConfig,
  BatchSellQuotesResults,
  QuoteRequestContext,
  QuoteRequestParams,
  SendAssetEntry,
} from '../types';
import {
  getBatchSellQuotes,
  getBatchSellQuotesValidationErrors,
} from '../../../../../ducks/batch-sell/selectors';
import { buildResults } from '../utils/buildResults';
import { buildQuoteRequestForEntry } from '../utils/buildQuoteRequest';
import { buildQuoteRequestContext } from '../utils/buildQuoteRequestContext';
import { QUOTE_REQUEST_DEBOUNCE_MS } from '../../../../../constants/batch-sell';

type Options = {
  enabled: boolean;
};

export const useBatchSellQuotesFetching = (
  { sendAssetsConfig, receivedAsset }: BatchSellQuotesConfig,
  { enabled }: Options,
) => {
  const dispatch = useDispatch();

  const selectedAccount = useSelector(getFromAccount);
  const smartTransactionsEnabled = useSelector(getIsStxEnabled);

  const entries = useMemo<SendAssetEntry[]>(
    () =>
      Object.entries(sendAssetsConfig).map(
        ([
          assetId,
          { asset, sendAmountPercent, slippagePercent, enabled: entryEnabled },
        ]) => ({
          assetId: assetId as CaipAssetType,
          asset,
          sendAmountPercent,
          slippagePercent,
          enabled: entryEnabled,
        }),
      ),
    [sendAssetsConfig],
  );

  const requestCount = entries.length;

  const controllerResult = useSelector((state: BridgeAppState) =>
    getBatchSellQuotes(state, { requestCount }),
  );

  const validationErrorsByIndex = useSelector((state: BridgeAppState) =>
    getBatchSellQuotesValidationErrors(state, { requestCount }),
  );

  const data = useMemo<BatchSellQuotesResults | undefined>(() => {
    if (!enabled || requestCount === 0) {
      return undefined;
    }
    return buildResults({
      controllerResult,
      entries,
      receivedAsset,
      validationErrorsByIndex,
    });
  }, [
    enabled,
    requestCount,
    controllerResult,
    entries,
    receivedAsset,
    validationErrorsByIndex,
  ]);

  const debouncedDispatchQuoteRequests = useRef(
    debounce(
      (
        requests: {
          params: QuoteRequestParams;
          context: QuoteRequestContext;
          index: number;
          total: number;
        }[],
      ) => {
        requests.forEach(({ params, context, index, total }) => {
          dispatch(updateQuoteRequestParams(params, context, index, total));
        });
      },
      QUOTE_REQUEST_DEBOUNCE_MS,
    ),
  );

  useEffect(() => {
    if (!enabled || requestCount === 0 || !selectedAccount?.address) {
      return;
    }

    const requests = entries
      .map((entry, index) => {
        const params = buildQuoteRequestForEntry({
          entry,
          destAssetId: receivedAsset.id,
          walletAddress: selectedAccount.address,
        });
        if (!params) {
          return undefined;
        }
        return {
          params,
          context: buildQuoteRequestContext({
            sourceAsset: entry.asset,
            receivedAsset,
            sendAmountPercent: entry.sendAmountPercent,
            smartTransactionsEnabled,
          }),
          index,
          total: requestCount,
        };
      })
      .filter((request) => request !== undefined);

    if (requests.length === 0) {
      return;
    }

    dispatch(setSelectedQuote(null));
    debouncedDispatchQuoteRequests.current(requests);
  }, [
    enabled,
    entries,
    receivedAsset,
    requestCount,
    selectedAccount?.address,
    smartTransactionsEnabled,
    dispatch,
  ]);

  // Cancel pending dispatches and reset controller state on unmount so quotes
  // don't leak across navigations between batch-sell and other flows.
  useEffect(() => {
    const debounced = debouncedDispatchQuoteRequests.current;
    return () => {
      debounced.cancel();
      dispatch(resetBridgeController());
    };
  }, [dispatch]);

  // Set loading to true on first render.
  const hasEverFetched = controllerResult.quotesLastFetchedMs !== null;
  const isLoading =
    enabled &&
    requestCount > 0 &&
    (!hasEverFetched || controllerResult.isLoading);

  return {
    data,
    entries,
    isLoading,
    quotesLastFetchedMs: controllerResult.quotesLastFetchedMs,
  };
};
