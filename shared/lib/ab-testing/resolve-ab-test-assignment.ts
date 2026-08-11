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
  // Threshold flags expose the selected value directly, with the selected group
  // name stored separately in `featureFlagThresholdGroups`. Read the variant
  // name from the flag value first (so a local override can force a variant),
  // then fall back to the threshold group when the value carries no name.
  const variantName =
    getFlagVariantName(featureFlags?.[flagKey]) ?? thresholdGroups?.[flagKey];
  const isActive = Boolean(variantName && validVariants.includes(variantName));

  return {
    variantName: isActive && variantName ? variantName : DEFAULT_VARIANT,
    isActive,
  };
}
