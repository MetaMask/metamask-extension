import type { Preferences } from '../../types/preferences';

export type PreferencesMetaMaskState = {
  metamask: { preferences?: Partial<Preferences> };
};

// Returns the runtime value as-is (a partial of `Preferences` from state, or
// `{}` when absent) but typed as the full `Preferences` to preserve the
// implicit contract callers had under the original JS implementation.
export function getPreferences({
  metamask,
}: PreferencesMetaMaskState): Preferences {
  return (metamask.preferences ?? {}) as Preferences;
}
