import { useCallback, useContext } from 'react';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../shared/constants/metametrics';
import { SortOrder } from '../../pages/bridge/types';
import {
  RequestParams,
  RequestMetadata,
  TradeData,
  QuoteFetchData,
  ActionType,
  TxStatusData,
} from './events/types';

export type CrossChainSwapsEventProperties = {
  [MetaMetricsEventName.ActionOpened]: RequestParams & {
    location: MetaMetricsSwapsEventSource;
  };
  [MetaMetricsEventName.ActionCompleted]: RequestParams &
    RequestMetadata &
    TradeData &
    TxStatusData & {
      usd_actual_return: number;
      actual_time_minutes: number;
      quote_vs_execution_ratio: number;
      quoted_vs_used_gas_ratio: number;
    };
  [MetaMetricsEventName.ActionSubmitted]: RequestParams &
    RequestMetadata &
    TradeData;
  [MetaMetricsEventName.ActionFailed]: RequestParams &
    RequestMetadata &
    TradeData &
    TxStatusData & {
      actual_time_minutes: number;
      error_message: string;
    };
  [MetaMetricsEventName.CrossChainSwapsQuotesRequested]: RequestParams &
    RequestMetadata & {
      has_sufficient_funds: boolean;
    };
  [MetaMetricsEventName.AllQuotesOpened]: RequestParams &
    RequestMetadata &
    QuoteFetchData;
  [MetaMetricsEventName.AllQuotesSorted]: RequestParams &
    RequestMetadata &
    QuoteFetchData;
  [MetaMetricsEventName.QuoteSelected]: RequestParams &
    RequestMetadata &
    QuoteFetchData &
    TradeData & {
      is_best_quote: boolean;
    };
  [MetaMetricsEventName.CrossChainSwapsQuotesReceived]: RequestParams &
    RequestMetadata &
    QuoteFetchData &
    TradeData & {
      refresh_count: number; // starts from 0
      warnings: string[];
    };
  [MetaMetricsEventName.InputSourceDestinationFlipped]: RequestParams;
  [MetaMetricsEventName.InputChanged]: {
    input:
      | 'token_source'
      | 'token_destination'
      | 'chain_source'
      | 'chain_destination'
      | 'slippage';
    value: string;
  };
  [MetaMetricsEventName.CrossChainSwapsQuoteError]: RequestParams &
    RequestMetadata & {
      error_message: string;
      has_sufficient_funds: boolean;
    };
};

/**
 * Returns trackCrossChainSwapsEvent method, which emits metrics using the provided event name, category, and properties.
 * The callback has type-safe parameters to ensure input properties satisfy the required event properties defined in CrossChainSwapsEventProperties.
 *
 * @returns The trackCrossChainSwapsEvent method which wraps the MetaMetricsContext trackEvent method.
 */
export const useCrossChainSwapsEventTracker = () => {
  const trackEvent = useContext(MetaMetricsContext);

  const trackCrossChainSwapsEvent = useCallback(
    <EventName extends keyof CrossChainSwapsEventProperties>({
      event,
      category,
      properties,
    }: {
      event: EventName;
      category?: MetaMetricsEventCategory;
      properties: CrossChainSwapsEventProperties[EventName];
    }) => {
      trackEvent({
        category: category ?? MetaMetricsEventCategory.CrossChainSwaps,
        event,
        properties: {
          action_type: ActionType.CROSSCHAIN_V1,
          ...properties,
        },
      });
    },
    [trackEvent],
  );

  return trackCrossChainSwapsEvent;
};
