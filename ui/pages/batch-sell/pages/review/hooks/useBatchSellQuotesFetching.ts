import { useCallback, useEffect, useMemo, useRef } from 'react';
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
      Object.values(sendAssetsConfig).map(
        ({
          asset,
          sendAmountPercent,
          slippagePercent,
          enabled: entryEnabled,
        }) => ({
          assetId: asset.assetId,
          asset,
          sendAmountPercent,
          slippagePercent,
          enabled: entryEnabled,
        }),
      ),
    [sendAssetsConfig],
  );

  // Only enabled entries are sent to the controller, so disabled slots (a
  // percentage of 0 or a toggled-off asset) are never quoted. This keeps the
  // controller's pre-aggregated totals correct and lets the UI consume them
  // directly instead of re-summing per slot.
  const enabledEntries = useMemo(
    () => entries.filter((entry) => entry.enabled),
    [entries],
  );

  const requestCount = enabledEntries.length;

  const controllerResult = useSelector((state: BridgeAppState) =>
    getBatchSellQuotes(state, { requestCount }),
  );

  const validationErrorsByIndex = useSelector((state: BridgeAppState) =>
    getBatchSellQuotesValidationErrors(state, { requestCount }),
  );

  const hasEverFetched = controllerResult.quotesLastFetchedMs !== null;
  const isLoading =
    enabled &&
    requestCount > 0 &&
    (!hasEverFetched || controllerResult.isLoading);

  const data = useMemo<BatchSellQuotesResults | undefined>(() => {
    if (!enabled || entries.length === 0) {
      return undefined;
    }
    return buildResults({
      controllerResult,
      entries,
      receivedAsset,
      validationErrorsByIndex,
      isLoading,
    });
  }, [
    enabled,
    controllerResult,
    entries,
    receivedAsset,
    validationErrorsByIndex,
    isLoading,
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

  const refetch = useCallback(() => {
    if (!enabled || enabledEntries.length === 0 || !selectedAccount?.address) {
      return;
    }

    const requests = enabledEntries
      .map((entry) => {
        const params = buildQuoteRequestForEntry({
          entry,
          destAssetId: receivedAsset.assetId,
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
        };
      })
      .filter((request) => request !== undefined)
      .map((request, index, allRequests) => ({
        ...request,
        index,
        total: allRequests.length,
      }));

    if (requests.length === 0) {
      return;
    }

    dispatch(setSelectedQuote(null));
    debouncedDispatchQuoteRequests.current(requests);
  }, [
    enabled,
    enabledEntries,
    receivedAsset,
    selectedAccount?.address,
    smartTransactionsEnabled,
    dispatch,
  ]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Cancel pending dispatches and reset controller state on unmount so quotes
  // don't leak across navigations between batch-sell and other flows.
  useEffect(() => {
    const debounced = debouncedDispatchQuoteRequests.current;
    return () => {
      debounced.cancel();
      dispatch(resetBridgeController());
    };
  }, [dispatch]);

  const areQuotesRefreshExpired =
    !isLoading && hasEverFetched && !controllerResult.isQuoteGoingToRefresh;

  return {
    data,
    entries,
    isLoading,
    quotesLastFetchedMs: controllerResult.quotesLastFetchedMs,
    isQuoteGoingToRefresh: controllerResult.isQuoteGoingToRefresh,
    areQuotesRefreshExpired,
    refetch,
  };
};
