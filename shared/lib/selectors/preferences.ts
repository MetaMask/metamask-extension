import type { Preferences } from '../../types/preferences';

export type PreferencesMetaMaskState = {
  metamask: { preferences?: Partial<Preferences> };
};

export function getPreferences({
  metamask,
}: PreferencesMetaMaskState): Partial<Preferences> {
  return metamask.preferences ?? {};
}
