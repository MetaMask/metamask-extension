import { validatedVersionGatedFeatureFlag } from '../remote-feature-flag-utils';

/**
 * The LaunchDarkly flag that gates the Money Account surface. The same flag
 * name and shape mobile reads in `app/lib/Money/feature-flags.ts`, so the two
 * clients turn on and off together.
 */
export const MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME = 'moneyEnableMoneyAccount';

/**
 * The LaunchDarkly flag that gates the realized Earnings section on Money
 * Home.
 */
export const MONEY_EARNING_SECTION_ENABLED_FLAG_NAME =
  'earnMoneyEarningSectionEnabled';

/**
 * Whether the Money Account feature is enabled.
 *
 * The flag is version-gated, so an absent, malformed, or below-minimum-version
 * value means "off" — the surface stays hidden rather than defaulting on.
 *
 * @param remoteFeatureFlags - The remote feature flags.
 * @returns Whether the Money Account feature is enabled.
 */
export function isMoneyAccountEnabled(
  remoteFeatureFlags: Record<string, unknown> | undefined,
): boolean {
  return (
    validatedVersionGatedFeatureFlag(
      remoteFeatureFlags?.[MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME],
    ) ?? false
  );
}

/**
 * Whether the realized Earnings section on Money Home is enabled.
 *
 * The flag is version-gated and fails closed when absent, malformed, or below
 * the current extension version.
 *
 * @param remoteFeatureFlags - The remote feature flags.
 * @returns Whether the Earnings section is enabled.
 */
export function isMoneyEarningSectionEnabled(
  remoteFeatureFlags: Record<string, unknown> | undefined,
): boolean {
  return (
    validatedVersionGatedFeatureFlag(
      remoteFeatureFlags?.[MONEY_EARNING_SECTION_ENABLED_FLAG_NAME],
    ) ?? false
  );
}
