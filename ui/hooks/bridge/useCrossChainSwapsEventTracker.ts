import { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import { SortOrder, formatChainIdToCaip } from '@metamask/bridge-controller';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { getFromChain } from '../../ducks/bridge/selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../shared/constants/metametrics';
import {
  RequestParams,
  RequestMetadata,
  TradeData,
  QuoteFetchData,
  ActionType,
  TxStatusData,
} from './events/types';

export type CrossChainSwapsEventProperties = {
  [MetaMetricsEventName.ActionButtonClicked]: RequestParams & {
    location: MetaMetricsSwapsEventSource;
  };
  [MetaMetricsEventName.ActionPageViewed]: RequestParams;
  [MetaMetricsEventName.ActionCompleted]: RequestParams &
    RequestMetadata &
    TradeData &
    TxStatusData & {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      actual_time_minutes: number;
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      usd_actual_return: number;
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      usd_actual_gas: number;
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      quote_vs_execution_ratio: number;
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      quoted_vs_used_gas_ratio: number;
    };
  [MetaMetricsEventName.ActionSubmitted]: RequestParams &
    RequestMetadata &
    TradeData;
  [MetaMetricsEventName.ActionFailed]: RequestParams &
    RequestMetadata &
    TradeData &
    TxStatusData & {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      actual_time_minutes: number;
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      error_message: string;
    };
  [MetaMetricsEventName.CrossChainSwapsQuotesRequested]: RequestParams &
    RequestMetadata & {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      has_sufficient_funds: boolean;
    };
  [MetaMetricsEventName.AllQuotesOpened]: RequestParams &
    RequestMetadata &
    QuoteFetchData;
  [MetaMetricsEventName.AllQuotesSorted]: RequestParams &
    RequestMetadata &
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    QuoteFetchData & { sort_order: SortOrder };
  [MetaMetricsEventName.QuoteSelected]: RequestParams &
    RequestMetadata &
    QuoteFetchData &
    TradeData & {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_best_quote: boolean;
    };
  [MetaMetricsEventName.CrossChainSwapsQuotesReceived]: RequestParams &
    RequestMetadata &
    QuoteFetchData &
    TradeData & {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
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
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      error_message: string;
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
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
  const { trackEvent } = useContext(MetaMetricsContext);
  const fromChain = useSelector(getFromChain);

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
      const chainId = fromChain?.chainId
        ? formatChainIdToCaip(fromChain.chainId)
        : undefined;

      trackEvent({
        category: category ?? MetaMetricsEventCategory.CrossChainSwaps,
        event,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          action_type: ActionType.CROSSCHAIN_V1,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: chainId,
          ...properties,
        },
        value: 'value' in properties ? (properties.value as never) : undefined,
      });
    },
    [trackEvent, fromChain],
  );

  return trackCrossChainSwapsEvent;
};
