import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { hasMinimumRequiredVersion } from './remote-feature-flag-utils';

/**
 * LaunchDarkly flag key for the active-tab domain metrics allowlist.
 * Adding new domains requires a governance/privacy review before inclusion.
 */
export const ACTIVE_TAB_DOMAIN_METRICS_FLAG = 'extensionUxActiveDomainMetrics';

type ActiveTabDomainMetricsFlagSource = Pick<
  RemoteFeatureFlagControllerState,
  'remoteFeatureFlags'
>;

type ActiveTabDomainFlag = {
  value: unknown[];
  minimumVersion: string;
};

const isActiveTabDomainFlag = (flag: unknown): flag is ActiveTabDomainFlag =>
  typeof flag === 'object' &&
  flag !== null &&
  'value' in flag &&
  'minimumVersion' in flag &&
  Array.isArray(flag.value) &&
  typeof flag.minimumVersion === 'string';

const isNonEmptyString = (s: unknown): s is string =>
  typeof s === 'string' && s.length > 0;

/**
 * Returns the allowlist from the remote feature flag.
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

  return flag.value.filter(isNonEmptyString);
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
    const url = new URL(origin);
    if (url.protocol !== 'https:') {
      return undefined;
    }
    return allowlist.some(
      (domain) =>
        url.hostname === domain || url.hostname.endsWith(`.${domain}`),
    )
      ? url.origin
      : undefined;
  } catch {
    return undefined;
  }
}
