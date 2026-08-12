import type { Json } from '@metamask/utils';

import { getManifestFlags } from '../manifestFlags';
import { BOTTOM_NAV_AB_TEST_ANALYTICS_MAPPING } from './configs/bottom-nav-bar';
import { DEFI_REFERRAL_UI_AB_TEST_ANALYTICS_MAPPING } from './configs/defi-referral-ui';
import {
  createActiveABTestAssignment,
  normalizeActiveABTestAssignments,
  type ActiveABTestAssignment,
} from './active-ab-test-assignment';
import { resolveABTestAssignment } from './resolve-ab-test-assignment';

export type ABTestAnalyticsMapping = {
  flagKey: string;
  validVariants: readonly string[];
  eventNames: readonly string[];
};

export const AB_TEST_ANALYTICS_MAPPINGS: ABTestAnalyticsMapping[] = [
  DEFI_REFERRAL_UI_AB_TEST_ANALYTICS_MAPPING,
  BOTTOM_NAV_AB_TEST_ANALYTICS_MAPPING,
];
export function clearABTestAnalyticsMappings(): void {
  AB_TEST_ANALYTICS_MAPPINGS.length = 0;
}

/**
 * Registers an A/B test analytics mapping so that matching events are enriched
 * with their `active_ab_tests` assignment. Idempotent per `flagKey`.
 *
 * @param mapping - The analytics mapping to register.
 */
export function registerABTestAnalyticsMapping(
  mapping: ABTestAnalyticsMapping,
): void {
  if (
    !AB_TEST_ANALYTICS_MAPPINGS.some(
      ({ flagKey }) => flagKey === mapping.flagKey,
    )
  ) {
    AB_TEST_ANALYTICS_MAPPINGS.push(mapping);
  }
}

type ABTestAnalyticsEvent = {
  name: string;
  properties?: Record<string, Json>;
};

const hasEventName = (
  mapping: ABTestAnalyticsMapping,
  eventName: string,
): boolean => mapping.eventNames.includes(eventName);

export function hasABTestAnalyticsMappingForEvent(
  eventName: string,
  mappings: readonly ABTestAnalyticsMapping[] = AB_TEST_ANALYTICS_MAPPINGS,
): boolean {
  return mappings.some((mapping) => hasEventName(mapping, eventName));
}

export function getRemoteFeatureFlagsWithManifestOverrides(
  remoteFeatureFlags: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  return {
    ...remoteFeatureFlags,
    ...getManifestFlags().remoteFeatureFlags,
  };
}

const cloneEventWithAssignments = <TEvent extends ABTestAnalyticsEvent>(
  event: TEvent,
  assignments: ActiveABTestAssignment[],
): TEvent => ({
  ...event,
  properties: {
    ...event.properties,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    active_ab_tests: assignments as Json,
  },
});

export function enrichWithABTests<TEvent extends ABTestAnalyticsEvent>(
  event: TEvent,
  featureFlags: Record<string, unknown> | null | undefined,
  mappings: readonly ABTestAnalyticsMapping[] = AB_TEST_ANALYTICS_MAPPINGS,
): TEvent {
  const existingAssignments = normalizeActiveABTestAssignments(
    event.properties?.active_ab_tests,
  );
  const relevantMappings = mappings.filter((mapping) =>
    hasEventName(mapping, event.name),
  );

  if (relevantMappings.length === 0) {
    if (existingAssignments.length === 0) {
      return event;
    }

    return cloneEventWithAssignments(event, existingAssignments);
  }

  const injectedAssignments = relevantMappings.flatMap((mapping) => {
    const { variantName, isActive } = resolveABTestAssignment(
      featureFlags,
      mapping.flagKey,
      mapping.validVariants,
    );

    return isActive
      ? [createActiveABTestAssignment(mapping.flagKey, variantName)]
      : [];
  });

  if (injectedAssignments.length === 0) {
    if (existingAssignments.length === 0) {
      return event;
    }

    return cloneEventWithAssignments(event, existingAssignments);
  }

  const mergedAssignments = [...existingAssignments];
  const existingKeys = new Set(existingAssignments.map(({ key }) => key));

  for (const assignment of injectedAssignments) {
    if (existingKeys.has(assignment.key)) {
      continue;
    }

    existingKeys.add(assignment.key);
    mergedAssignments.push(assignment);
  }

  return cloneEventWithAssignments(event, mergedAssignments);
}
