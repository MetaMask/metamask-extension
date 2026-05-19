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
import { getMultichainProviderConfig } from '../../../../../selectors/multichain';
import { useMultichainSelector } from '../../../../../hooks/useMultichainSelector';
import {
  BatchSellQuotesConfig,
  BatchSellQuotesResults,
  QuoteRequestContext,
  QuoteRequestParams,
  SendAssetEntry,
} from '../types';
import {
  buildQuoteRequestContext,
  buildQuoteRequestForEntry,
  buildResults,
} from '../utils';
import {
  getBatchSellQuotes,
  getBatchSellQuotesValidationErrors,
} from '../../../../../ducks/batch-sell/selectors';

type Options = {
  enabled: boolean;
};

const QUOTE_REQUEST_DEBOUNCE_MS = 300;

export const useBatchSellQuotesFetching = (
  { sendAssetsConfig, receivedAsset }: BatchSellQuotesConfig,
  { enabled }: Options,
) => {
  const dispatch = useDispatch();

  const selectedAccount = useSelector(getFromAccount);
  const providerConfig = useMultichainSelector(getMultichainProviderConfig);
  const smartTransactionsEnabled = useSelector(getIsStxEnabled);

  const entries = useMemo<SendAssetEntry[]>(
    () =>
      Object.entries(sendAssetsConfig).map(
        ([assetId, { asset, sendAmountPercent, slippagePercent }]) => ({
          assetId: assetId as CaipAssetType,
          asset,
          sendAmountPercent,
          slippagePercent,
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

  // The dispatcher reference is stable across renders. `useRef(debounce(...))`
  // is used because `useCallback` and React Compiler don't track that
  // `debounce` returns a fresh function reference; the inner function only
  // touches `dispatch` and an action creator, so it's safe not to recreate.
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
          rpcUrl: providerConfig?.rpcUrl,
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
    providerConfig?.rpcUrl,
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

  return { data, isLoading };
};
