import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlagsWithManifestOverrides } from '../../../shared/lib/ab-testing/ab-test-analytics';

export type FeatureFlagTagConfig = {
  // Flag key inside remoteFeatureFlags.
  name: string;
  // Sentry tag key. Defaults to `featureFlag.<name>`.
  tag?: string;
  // How to turn the stored flag value into a short tag string.
  // Defaults to the effective (version-gated) boolean.
  resolve?: (value: unknown) => string;
};

// Allowlist: add a flag here to start tagging it on Sentry errors.
export const SENTRY_FEATURE_FLAG_TAGS: FeatureFlagTagConfig[] = [
  { name: 'platformPersistenceSuspendWritesOnShutdown' },
];

const defaultResolve = (value: unknown): string =>
  String(getBooleanFeatureFlag(value, false));

/**
 * Reads a nested value from an unknown object by walking a key path, returning
 * undefined as soon as a segment is missing or not an object.
 *
 * @param value - The root value to walk.
 * @param path - The ordered keys to follow.
 * @returns The nested value, or undefined if the path does not resolve.
 */
function getNested(value: unknown, path: string[]): unknown {
  let current = value;
  for (const key of path) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Locates the remote feature flags map inside a Sentry app-state snapshot,
 * handling the different shapes produced across contexts:
 * - UI post-init: `state.metamask.remoteFeatureFlags`
 * - Background post-init: `state.RemoteFeatureFlagController.remoteFeatureFlags`
 * - Pre-init boot window: `persistedState.data.RemoteFeatureFlagController.remoteFeatureFlags`
 *
 * @param appState - The snapshot returned by the Sentry `getState()` hook.
 * @returns The remote feature flags map, or undefined if not available.
 */
function resolveRemoteFeatureFlags(
  appState: unknown,
): Record<string, unknown> | undefined {
  const candidates = [
    getNested(appState, ['state', 'metamask', 'remoteFeatureFlags']),
    getNested(appState, [
      'state',
      'RemoteFeatureFlagController',
      'remoteFeatureFlags',
    ]),
    getNested(appState, [
      'persistedState',
      'data',
      'RemoteFeatureFlagController',
      'remoteFeatureFlags',
    ]),
  ];
  const flags = candidates.find(
    (candidate) => typeof candidate === 'object' && candidate !== null,
  );
  return flags as Record<string, unknown> | undefined;
}

/**
 * Builds Sentry tags for the allowlisted remote feature flags found in a Sentry
 * app-state snapshot, with manifest overrides applied on top (same effective
 * value path as background gating / the UI selector). Each flag becomes a
 * short, filterable tag reflecting its effective value, or `unset` when the
 * flag is absent from both state and manifest overrides.
 *
 * @param appState - The snapshot returned by the Sentry `getState()` hook.
 * @param configs - The flags to tag. Defaults to {@link SENTRY_FEATURE_FLAG_TAGS}.
 * @returns A map of Sentry tag keys to string values.
 */
export function getFeatureFlagTags(
  appState: unknown,
  configs: FeatureFlagTagConfig[] = SENTRY_FEATURE_FLAG_TAGS,
): Record<string, string> {
  const flags = getRemoteFeatureFlagsWithManifestOverrides(
    resolveRemoteFeatureFlags(appState),
  );
  const tags: Record<string, string> = {};
  for (const { name, tag, resolve } of configs) {
    const key = tag ?? `featureFlag.${name}`;
    tags[key] =
      name in flags ? (resolve ?? defaultResolve)(flags[name]) : 'unset';
  }
  return tags;
}
