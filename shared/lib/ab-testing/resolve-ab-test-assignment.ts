import { BOTTOM_NAV_AB_TEST_KEY } from './configs/bottom-nav-bar';
import { ABTestVariant } from './variants';

export type ABTestResolution = {
  variantName: string;
  isActive: boolean;
};

const DEFAULT_VARIANT = 'control';

const getFlagVariantName = (flagValue: unknown): string | undefined => {
  if (typeof flagValue === 'string') {
    return flagValue;
  }

  if (
    flagValue &&
    typeof flagValue === 'object' &&
    'name' in flagValue &&
    typeof flagValue.name === 'string'
  ) {
    return flagValue.name;
  }

  return undefined;
};

export function resolveABTestAssignment(
  featureFlags: Record<string, unknown> | null | undefined,
  flagKey: string,
  validVariants: readonly string[],
  thresholdGroups?: Record<string, string> | null,
): ABTestResolution {
  // Read the variant name from the flag value first (a local override can force
  // a variant), then fall back to the selected group name in
  // `featureFlagThresholdGroups` when the value carries no name.
  const variantName =
    getFlagVariantName(featureFlags?.[flagKey]) ?? thresholdGroups?.[flagKey];
  const isActive = Boolean(variantName && validVariants.includes(variantName));
  const fallbackVariant =
    flagKey === BOTTOM_NAV_AB_TEST_KEY &&
    !process.env.IN_TEST &&
    process.env.NODE_ENV !== 'test'
      ? ABTestVariant.Treatment
      : DEFAULT_VARIANT;

  return {
    variantName: isActive && variantName ? variantName : fallbackVariant,
    isActive,
  };
}
