/**
 * Utility functions for Trezor adapter validation and device checks.
 */

const TREZOR_MODELS_USING_TREZOR_SUITE = new Set(['safe 7']);

const REQUIRED_TREZOR_CAPABILITIES = [
  'Capability_Bitcoin',
  'Capability_Solana',
  'Capability_Ethereum',
] as const;
type RequiredTrezorCapability = (typeof REQUIRED_TREZOR_CAPABILITIES)[number];

/**
 * Check whether a Trezor model uses Trezor Suite (no popup-based sessions).
 *
 * @param model - The model identifier returned by the device features
 * @returns True if the model communicates via Trezor Suite instead of popups
 */
export const isTrezorModelUsingTrezorSuite = (model: string): boolean =>
  TREZOR_MODELS_USING_TREZOR_SUITE.has(model.toLowerCase());

/**
 * Determine which required capabilities are absent from the device's reported set.
 *
 * @param capabilities - Raw capabilities payload from the device (may be unknown/untyped)
 * @returns Array of required capability strings that are missing
 */
export function getMissingCapabilities(
  capabilities: unknown,
): RequiredTrezorCapability[] {
  const capabilitiesSet = new Set(
    Array.isArray(capabilities)
      ? capabilities.filter(
          (capability): capability is RequiredTrezorCapability =>
            typeof capability === 'string',
        )
      : [],
  );

  return REQUIRED_TREZOR_CAPABILITIES.filter(
    (requiredCapability) => !capabilitiesSet.has(requiredCapability),
  );
}

/**
 * Check whether the given model identifier refers to a Trezor Model One.
 *
 * @param model - The model identifier to check
 * @returns True if the model is a Trezor Model One variant
 */
export function isTrezorModelOne(model: unknown): boolean {
  if (typeof model !== 'string') {
    return false;
  }

  const normalizedModel = model.toLowerCase();
  return (
    normalizedModel === '1' ||
    normalizedModel === 't1b1' ||
    normalizedModel.includes('model one')
  );
}
