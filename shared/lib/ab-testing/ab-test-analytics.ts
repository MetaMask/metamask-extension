import type { Json } from '@metamask/utils';

import type { MetaMetricsEventPayload } from '../../constants/metametrics';
import { getManifestFlags } from '../manifestFlags';
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

export const AB_TEST_ANALYTICS_MAPPINGS: ABTestAnalyticsMapping[] = [];
export function clearABTestAnalyticsMappings(): void {
  AB_TEST_ANALYTICS_MAPPINGS.length = 0;
}

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

const cloneEventWithAssignments = <TEvent extends MetaMetricsEventPayload>(
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

export function enrichWithABTests<TEvent extends MetaMetricsEventPayload>(
  event: TEvent,
  featureFlags: Record<string, unknown> | null | undefined,
  mappings: readonly ABTestAnalyticsMapping[] = AB_TEST_ANALYTICS_MAPPINGS,
): TEvent {
  const existingAssignments = normalizeActiveABTestAssignments(
    event.properties?.active_ab_tests,
  );
  const relevantMappings = mappings.filter((mapping) =>
    hasEventName(mapping, event.event),
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
