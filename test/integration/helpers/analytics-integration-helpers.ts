import type { AnalyticsEvent } from '../../../shared/lib/analytics/create-event-builder';

type BackgroundRpcCall = [string, unknown[]];

export function findTrackAnalyticsEventCall(
  calls: BackgroundRpcCall[] | undefined,
  predicate?: (event: AnalyticsEvent) => boolean,
): BackgroundRpcCall | undefined {
  return calls?.find((call) => {
    if (call[0] !== 'trackAnalyticsEvent') {
      return false;
    }

    const event = call[1]?.[0] as AnalyticsEvent | undefined;
    return predicate ? Boolean(event && predicate(event)) : Boolean(event);
  });
}

export function getAnalyticsEventFromCall(
  call: BackgroundRpcCall | undefined,
): AnalyticsEvent | undefined {
  return call?.[1]?.[0] as AnalyticsEvent | undefined;
}

export function getAnalyticsEventOptionsFromCall(
  call: BackgroundRpcCall | undefined,
): Record<string, unknown> | undefined {
  return call?.[1]?.[1] as Record<string, unknown> | undefined;
}
