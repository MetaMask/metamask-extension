import type { AnalyticsControllerState } from '@metamask/analytics-controller';
import { isObject } from '@metamask/utils';
import { omit } from 'lodash';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { UTM_PARAMETERS } from '../../../../shared/types/metametrics';
import type { SegmentCallback, SegmentClient, SegmentTrackPayload } from '.';

export type SegmentDeliveryState = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OnboardingController?: { completedOnboarding: boolean };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  PreferencesController?: { useExternalServices: boolean };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AnalyticsController?: Pick<
    AnalyticsControllerState,
    'analyticsId' | 'optedIn' | 'optedInToMarketing' | 'eventQueue'
  >;
};

/**
 * Hold Segment delivery until onboarding completes. Controller delivery
 * callbacks stay pending, so its existing persisted queue survives restarts.
 * Recheck that queue on release: consent changes may have removed an event.
 *
 * @param client - Segment transport.
 * @returns Gated client and a background-state subscription callback.
 */
export function createSegmentDeliveryGate(client: SegmentClient): {
  segment: SegmentClient;
  updateState: (
    nextState: SegmentDeliveryState,
    deliveryEnabled?: boolean,
  ) => void;
  initializeState: (initialState: SegmentDeliveryState) => void;
} {
  type PendingEvent = {
    method: 'track' | 'identify' | 'page';
    payload: SegmentTrackPayload;
    callback?: SegmentCallback;
  };
  let state: SegmentDeliveryState | undefined;
  let deliveryEnabled = true;
  const pending = new Map<string | symbol, PendingEvent>();
  const isReady = () =>
    deliveryEnabled &&
    state?.OnboardingController?.completedOnboarding === true &&
    state.PreferencesController?.useExternalServices === true;

  const send = ({
    method,
    payload: capturedPayload,
    callback,
  }: PendingEvent) => {
    let payload = capturedPayload;
    if (state) {
      const analytics = state.AnalyticsController;
      const queuedEvent = payload.messageId
        ? analytics?.eventQueue?.[payload.messageId]
        : undefined;
      const isAllowed = payload.messageId
        ? Boolean(queuedEvent)
        : payload.userId === analytics?.analyticsId &&
          (analytics?.optedIn === true ||
            payload.event === MetaMetricsEventName.MetricsOptOut);
      if (
        !isAllowed ||
        (payload.userId !== undefined &&
          payload.userId !== analytics?.analyticsId) ||
        state.PreferencesController?.useExternalServices !== true
      ) {
        callback?.();
        return;
      }
      if (isObject(queuedEvent) && isObject(queuedEvent.context)) {
        payload = {
          ...payload,
          context: { ...payload.context, consent: queuedEvent.context.consent },
        };
      }
      if (analytics?.optedInToMarketing !== true && payload.properties) {
        payload = {
          ...payload,
          properties: omit(payload.properties, [...UTM_PARAMETERS]),
        };
      }
    }
    if (!isReady()) {
      pending.set(payload.messageId ?? Symbol('direct Segment event'), {
        method,
        payload,
        callback,
      });
      return;
    }
    client[method](payload, callback);
  };
  const updateState = (
    nextState: SegmentDeliveryState,
    enableDelivery = true,
  ) => {
    state = nextState;
    deliveryEnabled = enableDelivery;
    const events = [...pending.values()];
    pending.clear();
    events.forEach(send);
  };

  return {
    segment: {
      track: (payload, callback) =>
        send({ method: 'track', payload, callback }),
      identify: (payload, callback) =>
        send({ method: 'identify', payload, callback }),
      page: (payload, callback) => send({ method: 'page', payload, callback }),
      flush: () => (isReady() ? client.flush() : Promise.resolve()),
    },
    updateState,
    initializeState(initialState) {
      // Early startup diagnostics may run before background construction succeeds.
      // A persisted snapshot must never replace newer live controller state.
      if (!state) {
        updateState(initialState);
      }
    },
  };
}
