/*
 * Maps UI-side ramps buy-flow events onto the `metamask-ramps` Segment schema.
 * The whole checkout funnel and the terminal transaction KPIs fire from the
 * background instead — see `trackRampsCheckoutAnalytics.ts` and
 * `buildRampsTransactionCompletedProperties.ts`.
 */
/* eslint-disable @typescript-eslint/naming-convention */
import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  RAMPS_RAMP_ROUTING,
  RAMPS_RAMP_TYPE,
} from '../../../shared/lib/ramps/analytics';
import { getIsRampsEnabled } from '../../selectors/ramps-feature-flags';
import { useAnalytics } from '../useAnalytics';
import { useRampsUserRegion } from './useRampsUserRegion';

export type RampsTokenSelectedArgs = {
  tokenCaip19?: string;
  tokenSymbol?: string;
  // CAIP-2 chain_id of the destination currency (per schema).
  currencyDestination: string;
  currencyDestinationSymbol?: string;
  currencyDestinationNetwork?: string;
};

export type RampsProviderSelectedArgs = {
  provider: string;
  previousProvider?: string;
  location: string;
};

/**
 * Analytics for the in-app ramps buy flow. Wraps `useAnalytics` and injects the
 * shared context (region, currency source, ramp type) every `ramps-*` event
 * needs, so call sites only pass event-specific properties.
 *
 * All tracking is a no-op when the `rampsEnabled` flag is off — the flow is
 * already unreachable in that case, this is belt-and-suspenders for the AC
 * "no events fire when the flag is off".
 */
export function useRampsAnalytics() {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const isRampsEnabled = useSelector(getIsRampsEnabled);
  const { userRegion } = useRampsUserRegion();

  // Region/currency load asynchronously. Read them through refs so the track
  // callbacks keep a stable identity as the region resolves — otherwise a
  // callback listed in a mount `useEffect` dep array (screen-viewed) would
  // re-fire on every region change and double-count. Refs are synced in an
  // effect (not during render) to satisfy the React Compiler refs rule.
  const regionRef = useRef('');
  const currencySourceRef = useRef('');
  useEffect(() => {
    regionRef.current = userRegion?.regionCode ?? '';
    currencySourceRef.current = userRegion?.country?.currency ?? '';
  }, [userRegion?.regionCode, userRegion?.country?.currency]);

  const track = useCallback(
    (name: MetaMetricsEventName, properties: Record<string, unknown>) => {
      if (!isRampsEnabled) {
        return;
      }
      trackEvent(
        createEventBuilder(name)
          .addCategory(MetaMetricsEventCategory.Ramps)
          .addProperties({
            ramp_type: RAMPS_RAMP_TYPE,
            ramp_routing: RAMPS_RAMP_ROUTING,
            ...properties,
          })
          .build(),
      );
    },
    [createEventBuilder, isRampsEnabled, trackEvent],
  );

  const trackScreenViewed = useCallback(
    (locationName: string) => {
      track(MetaMetricsEventName.RampsScreenViewed, {
        location: locationName,
        region: regionRef.current,
      });
    },
    [track],
  );

  const trackTokenSelected = useCallback(
    (args: RampsTokenSelectedArgs) => {
      track(MetaMetricsEventName.RampsTokenSelected, {
        region: regionRef.current,
        currency_source: currencySourceRef.current,
        token_caip19: args.tokenCaip19,
        token_symbol: args.tokenSymbol,
        currency_destination: args.currencyDestination,
        currency_destination_symbol: args.currencyDestinationSymbol,
        currency_destination_network: args.currencyDestinationNetwork,
      });
    },
    [track],
  );

  const trackProviderSelected = useCallback(
    (args: RampsProviderSelectedArgs) => {
      track(MetaMetricsEventName.RampsProviderSelected, {
        provider: args.provider,
        previous_provider: args.previousProvider,
        location: args.location,
      });
    },
    [track],
  );

  return {
    trackScreenViewed,
    trackTokenSelected,
    trackProviderSelected,
  };
}
