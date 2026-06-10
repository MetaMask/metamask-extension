import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';

/**
 * LaunchDarkly flag key for the active-tab domain metrics allowlist.
 * The flag value must be a JSON array of hostname strings (e.g. ["x.com", "twitter.com"]).
 * Adding new domains requires a governance/privacy review before inclusion in the flag.
 */
export const ACTIVE_TAB_DOMAIN_METRICS_FLAG =
  'extension-ux-active-domain-metrics';

type ActiveTabDomainMetricsFlagSource = Pick<
  RemoteFeatureFlagControllerState,
  'remoteFeatureFlags'
>;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

/**
 * Returns the domain allowlist sourced from the remote feature flag.
 * Falls back to the hardcoded {@link ACTIVE_TAB_DOMAIN_ALLOWLIST} when the
 * flag is absent, not an array, or contains no valid non-empty strings.
 *
 * @param source - Remote feature flag controller state slice.
 */
export function getActiveTabDomainAllowlist(
  source?: ActiveTabDomainMetricsFlagSource,
): readonly string[] {
  const flag =
    source?.remoteFeatureFlags?.[ACTIVE_TAB_DOMAIN_METRICS_FLAG];

  if (Array.isArray(flag)) {
    const validated = flag.filter(isNonEmptyString);
    if (validated.length > 0) {
      return validated;
    }
  }

  return [];
}

/**
 * Returns the canonical origin if its hostname is in the allowlist,
 * undefined otherwise.
 *
 * @param origin - The raw origin string from the active browser tab.
 * @param allowlist - The domain allowlist to check against.
 */
export function getActiveTabDomainForMetrics(
  origin: string | undefined,
  allowlist: string[],
): string | undefined {
  if (!origin) {
    return undefined;
  }
  try {
    const { hostname } = new URL(origin);
    return allowlist.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    )
      ? new URL(origin).origin
      : undefined;
  } catch {
    return undefined;
  }
}
