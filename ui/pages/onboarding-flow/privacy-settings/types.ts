export type PrivacySettingsView = 'privacy' | 'backup-and-sync' | 'network-rpc';

export const PRIVACY_SETTINGS_VIEW_TITLE_KEYS: Record<
  PrivacySettingsView,
  string
> = {
  privacy: 'privacy',
  'backup-and-sync': 'backupAndSync',
  'network-rpc': 'onboardingNetworkRpcNavLabel',
};
