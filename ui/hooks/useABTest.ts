import { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
import { MetaMetricsContext } from '../contexts/metametrics';
import { getRemoteFeatureFlags } from '../selectors/remote-feature-flags';

/**
 * Type constraint for variants object. Every A/B test must define a `control`
 * variant so the hook can provide a stable fallback when assignment is missing
 * or invalid.
 */
export type ABTestVariants = { control: unknown } & Record<string, unknown>;

/**
 * Optional metadata for automatic experiment exposure tracking.
 */
export type ABTestExposureMetadata<TVariants extends ABTestVariants> = {
  /** Human-readable experiment name. */
  experimentName?: string;
  /** Optional map from variant IDs to human-readable display names. */
  variationNames?: Partial<Record<Extract<keyof TVariants, string>, string>>;
};

/**
 * Return type for the `useABTest` hook.
 */
export type UseABTestResult<TVariants extends ABTestVariants> = {
  /** The locally defined payload for the assigned variant. */
  variant: TVariants[keyof TVariants];
  /** The assigned variant name, or `control` when falling back. */
  variantName: string;
  /** Whether the experiment has an active assignment. */
  isActive: boolean;
};

const trackedExposureAssignments = new Set<string>();
const inFlightExposureAssignments = new Map<string, Promise<void>>();
const MAX_TRACKED_EXPOSURE_ASSIGNMENTS = 500;

const getExposureCacheKey = (experimentId: string, variationId: string) =>
  `${experimentId}::${variationId}`;

const hasTrackedExposureAssignment = (assignmentKey: string) =>
  trackedExposureAssignments.has(assignmentKey) ||
  inFlightExposureAssignments.has(assignmentKey);

const rememberExposureAssignment = (assignmentKey: string) => {
  if (trackedExposureAssignments.has(assignmentKey)) {
    return;
  }

  if (trackedExposureAssignments.size >= MAX_TRACKED_EXPOSURE_ASSIGNMENTS) {
    const oldestAssignment = trackedExposureAssignments.values().next().value;

    if (oldestAssignment) {
      trackedExposureAssignments.delete(oldestAssignment);
    }
  }

  trackedExposureAssignments.add(assignmentKey);
};

const getAssignedVariantName = (flagData: unknown): string | undefined => {
  if (typeof flagData === 'string') {
    return flagData;
  }

  const namedFlagData = flagData as { name?: unknown } | null;

  if (
    typeof flagData === 'object' &&
    flagData !== null &&
    'name' in flagData &&
    typeof namedFlagData?.name === 'string'
  ) {
    return namedFlagData.name;
  }

  return undefined;
};

/**
 * Test-only helper for clearing the module-level exposure cache.
 */
export function clearABTestExposureTrackingForTest(): void {
  trackedExposureAssignments.clear();
  inFlightExposureAssignments.clear();
}

/**
 * Generic hook for remote-config backed A/B tests in the extension.
 *
 * The extension receives remote feature flags through
 * `RemoteFeatureFlagController`. When an experiment flag resolves to a
 * processed assignment object like `{ name, value }`, this hook maps the
 * assigned `name` to the locally-defined `variants` object.
 *
 * When the assignment is missing, invalid, or not yet bucketed, the hook falls
 * back to the `control` variant and reports `isActive: false`.
 *
 * When an active assignment is present, the hook automatically emits a single
 * `Experiment Viewed` event once per `experiment_id + variation_id` pair per
 * extension session.
 *
 * @param flagKey - Remote feature flag key, e.g. `swapsSWAPS4135AbtestButtonColor`
 * @param variants - Local mapping of variant IDs to render-time data.
 * @param exposureMetadata - Optional metadata for experiment exposure events.
 * @returns The assigned variant payload, variant name, and active state.
 */
export function useABTest<TVariants extends ABTestVariants>(
  flagKey: string,
  variants: TVariants,
  exposureMetadata?: ABTestExposureMetadata<TVariants>,
): UseABTestResult<TVariants> {
  const { trackEvent } = useContext(MetaMetricsContext);
  const flags = useSelector(getRemoteFeatureFlags);
  const flagData = flags?.[flagKey];
  const assignedVariantName = getAssignedVariantName(flagData);

  const hasVariant = (key: string) =>
    Object.prototype.hasOwnProperty.call(variants, key);

  const variantName =
    assignedVariantName && hasVariant(assignedVariantName)
      ? assignedVariantName
      : 'control';
  const isActive = Boolean(
    assignedVariantName && hasVariant(assignedVariantName),
  );
  const variationDisplayName =
    exposureMetadata?.variationNames?.[
      variantName as Extract<keyof TVariants, string>
    ];

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const variationId = String(variantName);
    const assignmentKey = getExposureCacheKey(flagKey, variationId);

    if (hasTrackedExposureAssignment(assignmentKey)) {
      return;
    }

    let trackingPromise: Promise<void>;

    try {
      trackingPromise = trackEvent({
        event: MetaMetricsEventName.ExperimentViewed,
        category: MetaMetricsEventCategory.Analytics,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          experiment_id: flagKey,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          variation_id: variationId,
          ...(exposureMetadata?.experimentName && {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            experiment_name: exposureMetadata.experimentName,
          }),
          ...(variationDisplayName && {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            variation_name: variationDisplayName,
          }),
        },
      });
    } catch {
      return;
    }

    const trackedPromise = trackingPromise
      .then(() => {
        rememberExposureAssignment(assignmentKey);
      })
      .catch(() => undefined)
      .finally(() => {
        inFlightExposureAssignments.delete(assignmentKey);
      });

    inFlightExposureAssignments.set(assignmentKey, trackedPromise);
  }, [
    exposureMetadata?.experimentName,
    flagKey,
    isActive,
    trackEvent,
    variantName,
    variationDisplayName,
  ]);

  return {
    variant: variants[variantName as keyof TVariants],
    variantName: String(variantName),
    isActive,
  };
}
