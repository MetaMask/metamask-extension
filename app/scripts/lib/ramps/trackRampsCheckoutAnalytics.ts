/*
 * Background counterpart to checkout events in `useRampsAnalytics`. Owns the
 * snake_case schema mapping for callback/closed events emitted from the
 * checkout tab watcher (survives popup unload).
 */
/* eslint-disable @typescript-eslint/naming-convention */
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type {
  AnalyticsEvent,
  AnalyticsEventBuilder,
} from '../../../../shared/lib/analytics/create-event-builder';

const RAMPS_RAMP_TYPE = 'UNIFIED_BUY_2';
const RAMPS_RAMP_ROUTING = 'AGGREGATOR';

export type RampsCheckoutAnalytics = {
  trackEvent: (built: AnalyticsEvent) => void;
  createEventBuilder: (eventName: string) => AnalyticsEventBuilder;
};

export type RampsCheckoutAnalyticsContext = {
  checkoutSessionId: string;
  checkoutOpenedAt: number;
  region?: string;
  orderCode?: string;
};

function sanitizeUrlPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}

function trackCheckoutEvent(
  analytics: RampsCheckoutAnalytics,
  eventName: MetaMetricsEventName,
  properties: Record<string, unknown>,
): void {
  analytics.trackEvent(
    analytics
      .createEventBuilder(eventName)
      .addCategory(MetaMetricsEventCategory.Ramps)
      .addProperties({
        ramp_type: RAMPS_RAMP_TYPE,
        ramp_routing: RAMPS_RAMP_ROUTING,
        location: 'Checkout',
        ...properties,
      })
      .build(),
  );
}

export function trackRampsCheckoutCallbackDetected(
  analytics: RampsCheckoutAnalytics,
  context: RampsCheckoutAnalyticsContext,
  callbackUrl: string,
  stepIndex: number,
): void {
  trackCheckoutEvent(
    analytics,
    MetaMetricsEventName.RampsCheckoutCallbackDetected,
    {
      region: context.region ?? '',
      checkout_session_id: context.checkoutSessionId,
      url_path: sanitizeUrlPath(callbackUrl),
      step_index: stepIndex,
      time_since_open_ms: Date.now() - context.checkoutOpenedAt,
    },
  );
}

export function trackRampsCheckoutClosed(
  analytics: RampsCheckoutAnalytics,
  context: RampsCheckoutAnalyticsContext,
  args: {
    closeSource: 'user_close_button' | 'callback_success';
    callbackReached: boolean;
    stepIndex: number;
  },
): void {
  trackCheckoutEvent(analytics, MetaMetricsEventName.RampsCheckoutClosed, {
    region: context.region ?? '',
    checkout_session_id: context.checkoutSessionId,
    close_source: args.closeSource,
    callback_reached: args.callbackReached,
    step_index: args.stepIndex,
    time_on_screen_ms: Date.now() - context.checkoutOpenedAt,
    ...(context.orderCode ? { order_id: context.orderCode } : {}),
  });
}
