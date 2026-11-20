import {
  isExtensionVersionNewer,
  isValidExtensionVersion,
} from '../../shared/lib/extension-version';
import { getRemoteFeatureFlags } from '../../shared/lib/selectors/remote-feature-flags';
import type { MetaMaskReduxState } from '../store/store';

export const EXTENSION_UPDATE_PROMPT_MINIMUM_VERSION_FLAG =
  'extensionUpdatePromptMinimumVersion';

export const EXTENSION_UPDATE_PROMPT_DEPRECATED_VERSION_FLAG =
  'extensionUpdatePromptDeprecatedVersion';

/** The prompt reappears only after strictly more than 24 hours. */
export const EXTENSION_UPDATE_PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type ExtensionUpdatePromptType =
  | 'none'
  | 'versionUpdate'
  | 'unsupportedVersion';

export type ExtensionUpdatePromptInputs = {
  /** Version of the running extension. */
  installedVersion: string | undefined;
  /** Newest version known to be available. */
  pendingVersion: string | null | undefined;
  /** Remote flag value; anything other than a valid version is ignored. */
  minimumVersion: unknown;
  /** Remote flag value; anything other than a valid version is ignored. */
  deprecatedVersion: unknown;
  /** Timestamp of the last dismissal of the prompt. */
  updateModalLastDismissedAt: number | null | undefined;
  /** Timestamp of the last extension update. */
  lastUpdatedAt: number | null | undefined;
  /** Current time in milliseconds. */
  now: number;
};

function readVersion(value: unknown): string | undefined {
  if (typeof value !== 'string' || !isValidExtensionVersion(value)) {
    return undefined;
  }
  return value;
}

function hasCooldownElapsed(
  timestamp: number | null | undefined,
  now: number,
): boolean {
  if (!timestamp) {
    return true;
  }
  return now - timestamp > EXTENSION_UPDATE_PROMPT_COOLDOWN_MS;
}

/**
 * Chooses the extension update prompt variant.
 *
 * - No prompt unless a newer version is pending and the installed version is
 *   below a valid minimum version.
 * - No prompt within 24 hours of the last dismissal or the last update.
 * - The unsupported variant when the installed version is below a valid
 *   deprecated version that is not above the minimum version. A missing,
 *   malformed, or too-high deprecated version falls back to the version-update
 *   variant.
 *
 * @param inputs - Versions, flag values, timestamps, and the current time.
 * @param inputs.installedVersion - The installed extension version.
 * @param inputs.pendingVersion - The version waiting to be installed.
 * @param inputs.minimumVersion - Remote flag: lowest version that skips the prompt.
 * @param inputs.deprecatedVersion - Remote flag: versions below it are unsupported.
 * @param inputs.updateModalLastDismissedAt - Timestamp of the last dismissal.
 * @param inputs.lastUpdatedAt - Timestamp of the last extension update.
 * @param inputs.now - The current time in milliseconds.
 * @returns The prompt variant, or `none` when the prompt must not show.
 */
export function resolveExtensionUpdatePromptType({
  installedVersion,
  pendingVersion,
  minimumVersion: minimumVersionFlag,
  deprecatedVersion: deprecatedVersionFlag,
  updateModalLastDismissedAt,
  lastUpdatedAt,
  now,
}: ExtensionUpdatePromptInputs): ExtensionUpdatePromptType {
  if (
    !pendingVersion ||
    !installedVersion ||
    !isExtensionVersionNewer(pendingVersion, installedVersion)
  ) {
    return 'none';
  }

  const minimumVersion = readVersion(minimumVersionFlag);
  if (
    !minimumVersion ||
    !isExtensionVersionNewer(minimumVersion, installedVersion)
  ) {
    return 'none';
  }

  if (
    !hasCooldownElapsed(updateModalLastDismissedAt, now) ||
    !hasCooldownElapsed(lastUpdatedAt, now)
  ) {
    return 'none';
  }

  const deprecatedVersion = readVersion(deprecatedVersionFlag);
  if (
    deprecatedVersion &&
    !isExtensionVersionNewer(deprecatedVersion, minimumVersion) &&
    isExtensionVersionNewer(deprecatedVersion, installedVersion)
  ) {
    return 'unsupportedVersion';
  }

  return 'versionUpdate';
}

/**
 * Selects the extension update prompt variant from state.
 *
 * Visibility gates (unlock, onboarding, and open dialogs) live in
 * `selectDisplayUpdateModal` and `selectIsUpdateModalDeferred`.
 *
 * @param state - Redux state.
 * @returns The prompt variant, or `none` when the prompt must not show.
 */
export function getExtensionUpdatePromptType(
  state: MetaMaskReduxState,
): ExtensionUpdatePromptType {
  const { pendingExtensionVersion, updateModalLastDismissedAt, lastUpdatedAt } =
    state.metamask;
  const remoteFeatureFlags = getRemoteFeatureFlags(state) as Record<
    string,
    unknown
  >;

  return resolveExtensionUpdatePromptType({
    installedVersion: global.platform?.getVersion(),
    pendingVersion: pendingExtensionVersion,
    minimumVersion:
      remoteFeatureFlags[EXTENSION_UPDATE_PROMPT_MINIMUM_VERSION_FLAG],
    deprecatedVersion:
      remoteFeatureFlags[EXTENSION_UPDATE_PROMPT_DEPRECATED_VERSION_FLAG],
    updateModalLastDismissedAt,
    lastUpdatedAt,
    now: Date.now(),
  });
}

/**
 * Returns true when either update prompt variant is pending, before the
 * surface and dialog gates.
 *
 * @param state - Redux state.
 * @returns Whether an update prompt is pending.
 */
export function getShowUpdateModal(state: MetaMaskReduxState): boolean {
  return getExtensionUpdatePromptType(state) !== 'none';
}
