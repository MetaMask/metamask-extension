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

  return {
    variantName: isActive && variantName ? variantName : DEFAULT_VARIANT,
    isActive,
  };
}
