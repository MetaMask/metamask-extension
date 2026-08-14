import PreferencesAndDisplaySettings from './preferences-and-display-settings';

/**
 * Settings → Assets: thin subclass of {@link PreferencesAndDisplaySettings}.
 *
 * Screen: `#/settings/assets`, reached from `SettingsPage.goToAssetsSettings`.
 * Owns: no extra locators — reuses parent helpers for the assets tab (load
 * check, hide-zero-balance, native-token balance, token/NFT autodetect).
 * Boundaries: assets tab only. Preferences/display and language/identicon
 * sub-pages stay on `PreferencesAndDisplaySettings`.
 * Related: `SettingsPage`, `PreferencesAndDisplaySettings`,
 * `flows/settings.flow.ts`.
 *
 * @see ui/pages/settings/assets-tab/assets-tab.tsx
 */
export default class AssetsSettingsPage extends PreferencesAndDisplaySettings {}
