import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { Json } from '@metamask/utils';
import { PERPS_EVENT_PROPERTY } from '../../../shared/constants/perps-events';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  PerpsAttributionReactContext,
  readScreenViewedHashAttribution,
} from '../../providers/perps/PerpsAttributionContext';
import { useAnalytics } from '../useAnalytics';

export type UsePerpsEventTrackingDeclarativeOptions = {
  eventName: MetaMetricsEventName;
  /**
   * When true the event fires once. The guard resets when conditions becomes
   * false, so the event fires again the next time conditions becomes true
   * (e.g. a modal that can be opened multiple times).
   */
  conditions: boolean;
  properties?: Record<string, Json>;
  /**
   * Optional key that, when changed, resets the fire-once guard so the event
   * fires again. Use when conditions stays true but the subject changes
   * (e.g. navigating between markets while the page stays mounted).
   */
  resetKey?: string | number | boolean | null;
};

export type PerpsTrackEventFn = (
  eventName: MetaMetricsEventName,
  properties?: Record<string, Json>,
) => void;

export function usePerpsEventTracking(): {
  track: PerpsTrackEventFn;
};
export function usePerpsEventTracking(
  options: UsePerpsEventTrackingDeclarativeOptions,
): void;
export function usePerpsEventTracking(
  options?: UsePerpsEventTrackingDeclarativeOptions,
): { track: PerpsTrackEventFn } | void {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hasFiredDeclarativeRef = useRef(false);

  // Read attribution without throwing: some PERPS_SCREEN_VIEWED call sites
  // (e.g. the compliance banner) are not wrapped by PerpsAttributionProvider.
  const attributionContext = useContext(PerpsAttributionReactContext);
  const screenViewedAttribution = attributionContext?.screenViewedAttribution;

  const buildPerpsEvent = useCallback(
    (eventName: MetaMetricsEventName, properties?: Record<string, Json>) => {
      // Merge stored UTM/deeplink attribution into PERPS_SCREEN_VIEWED at emit
      // time — that event is emitted from the client, so it never passes
      // through the controller's attribution merge.
      // Attribution wins over the call-site: UTM keys are never set by call
      // sites (always safe to add), and a deeplink entry is the authoritative
      // `source`, overriding the screen's default source value.
      // `readScreenViewedHashAttribution` reads the CURRENT hash query at emit
      // time and wins over the provider store. This is the authoritative UTM
      // source: react-router applies the destination `search` one render after
      // `window.location.hash` is already correct, and the declarative fire-once
      // guard blocks any enriched re-fire — so the entry emit must read the hash
      // directly (deterministic, no re-fire). Done for every PERPS_SCREEN_VIEWED
      // regardless of whether a provider wraps the call site, since a stale or
      // absent provider store must not drop UTM. The store still supplies the
      // sticky source and later in-app navigations whose hash lost the UTM.
      const attributedProperties =
        eventName === MetaMetricsEventName.PerpsScreenViewed
          ? {
              ...properties,
              ...(screenViewedAttribution ?? {}),
              ...readScreenViewedHashAttribution(),
            }
          : properties;
      return createEventBuilder(eventName)
        .addCategory(MetaMetricsEventCategory.Perps)
        .addProperties({
          ...attributedProperties,
          [PERPS_EVENT_PROPERTY.TIMESTAMP]: Date.now(),
        })
        .build();
    },
    [createEventBuilder, screenViewedAttribution],
  );

  const track = useCallback<PerpsTrackEventFn>(
    (eventName, properties) => {
      trackEvent(buildPerpsEvent(eventName, properties));
    },
    [buildPerpsEvent, trackEvent],
  );

  const imperativeApi = useMemo(() => ({ track }), [track]);

  // Reset the fire-once guard when resetKey changes so the event fires again
  // for a new subject (e.g. a different market symbol) even if conditions
  // stays true. Inline ref comparison during render is the canonical React
  // pattern for "reset when prop changes" — no useEffect needed, and no
  // eslint-disable comment that would cause the React Compiler to skip this hook.
  const resetKey = options?.resetKey;
  const prevResetKeyRef = useRef(resetKey);
  if (prevResetKeyRef.current !== resetKey) {
    prevResetKeyRef.current = resetKey;
    hasFiredDeclarativeRef.current = false;
  }

  useEffect(() => {
    if (!options) {
      return;
    }

    const { eventName, conditions, properties } = options;

    // Reset the guard when the condition clears so the event fires again on
    // the next open (handles modals that can be opened more than once).
    if (!conditions) {
      hasFiredDeclarativeRef.current = false;
      return;
    }

    if (hasFiredDeclarativeRef.current) {
      return;
    }

    hasFiredDeclarativeRef.current = true;
    trackEvent(buildPerpsEvent(eventName, properties));
  }, [options, trackEvent, buildPerpsEvent]);

  if (options) {
    return undefined;
  }

  return imperativeApi;
}
