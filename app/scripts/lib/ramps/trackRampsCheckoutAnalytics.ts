/*
 * Background counterpart to checkout events in `useRampsAnalytics`. Owns the
 * snake_case schema mapping for callback/closed events emitted from the
 * checkout tab watcher (survives popup unload).
 */
/* eslint-disable @typescript-eslint/naming-convention */
import type { Json } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  RAMPS_RAMP_ROUTING,
  RAMPS_RAMP_TYPE,
} from '../../../../shared/lib/ramps/analytics';
import { sanitizeUrlPath } from '../../../../shared/lib/ramps/url-path';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';

export type RampsCheckoutAnalyticsContext = {
  checkoutSessionId: string;
  checkoutOpenedAt: number;
  region?: string;
  orderCode?: string;
};

function trackCheckoutEvent(
  eventName: MetaMetricsEventName,
  properties: Record<string, Json | undefined>,
): void {
  trackEvent(
    createEventBuilder(eventName)
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

export function trackRampsCheckoutOpened(
  context: RampsCheckoutAnalyticsContext & {
    providerName?: string;
    checkoutUrl: string;
    hasCallbackFlow: boolean;
  },
): void {
  trackCheckoutEvent(MetaMetricsEventName.RampsCheckoutOpened, {
    region: context.region ?? '',
    checkout_session_id: context.checkoutSessionId,
    provider_name: context.providerName,
    initial_url_path: sanitizeUrlPath(context.checkoutUrl),
    has_callback_flow: context.hasCallbackFlow,
    order_id: context.orderCode,
  });
}

export function trackRampsCheckoutCallbackDetected(
  context: RampsCheckoutAnalyticsContext,
  callbackUrl: string,
  stepIndex: number,
): void {
  trackCheckoutEvent(MetaMetricsEventName.RampsCheckoutCallbackDetected, {
    region: context.region ?? '',
    checkout_session_id: context.checkoutSessionId,
    url_path: sanitizeUrlPath(callbackUrl),
    step_index: stepIndex,
    time_since_open_ms: Date.now() - context.checkoutOpenedAt,
  });
}

export function trackRampsCheckoutClosed(
  context: RampsCheckoutAnalyticsContext,
  args: {
    closeSource: 'user_close_button' | 'callback_success';
    callbackReached: boolean;
    stepIndex: number;
  },
): void {
  trackCheckoutEvent(MetaMetricsEventName.RampsCheckoutClosed, {
    region: context.region ?? '',
    checkout_session_id: context.checkoutSessionId,
    close_source: args.closeSource,
    callback_reached: args.callbackReached,
    step_index: args.stepIndex,
    time_on_screen_ms: Date.now() - context.checkoutOpenedAt,
    ...(context.orderCode ? { order_id: context.orderCode } : {}),
  });
}
