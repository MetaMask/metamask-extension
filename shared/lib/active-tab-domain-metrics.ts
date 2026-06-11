import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { hasMinimumRequiredVersion } from './remote-feature-flag-utils';

/**
 * LaunchDarkly flag key for the active-tab domain metrics allowlist.
 * Adding new domains requires a governance/privacy review before inclusion
 * in the flag.
 */
export const ACTIVE_TAB_DOMAIN_METRICS_FLAG =
  'extension-ux-active-domain-metrics';

type ActiveTabDomainMetricsFlagSource = Pick<
  RemoteFeatureFlagControllerState,
  'remoteFeatureFlags'
>;

/** Expected shape of the LaunchDarkly flag value. */
type ActiveTabDomainFlag = {
  value: unknown[];
  minimumVersion: string;
};

const isActiveTabDomainFlag = (v: unknown): v is ActiveTabDomainFlag =>
  typeof v === 'object' &&
  v !== null &&
  'value' in v &&
  Array.isArray((v as { value: unknown }).value) &&
  'minimumVersion' in v &&
  typeof (v as { minimumVersion: unknown }).minimumVersion === 'string';

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0;

/**
 * Returns the domain allowlist sourced from the remote feature flag.
 * Expected flag shape: `{ value: string[], minimumVersion: string }`
 *
 * @param source - Remote feature flag controller state slice.
 */
export function getActiveTabDomainAllowlist(
  source?: ActiveTabDomainMetricsFlagSource,
): string[] {
  const flag = source?.remoteFeatureFlags?.[ACTIVE_TAB_DOMAIN_METRICS_FLAG];

  if (!isActiveTabDomainFlag(flag)) {
    return [];
  }

  if (!hasMinimumRequiredVersion(flag.minimumVersion)) {
    return [];
  }

  const validated = flag.value.filter(isNonEmptyString);
  return validated;
}

/**
 * Returns the canonical origin if its hostname is in the allowlist,
 * undefined otherwise.
 *
 * @param origin - The raw origin string from the active browser tab.
 * @param allowlist - Domain hostnames to check against.
 */
export function getActiveTabDomainForMetrics(
  origin: string | undefined,
  allowlist: string[],
): string | undefined {
  if (!origin || allowlist.length === 0) {
    return undefined;
  }
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'https:') {
      return undefined;
    }
    return allowlist.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    )
      ? new URL(origin).origin
      : undefined;
  } catch {
    return undefined;
  }
}
