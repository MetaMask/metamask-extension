/**
 * Mobile route names -> extension URL hash paths.
 * Used by the `navigate` action to translate mobile route names to extension URLs.
 */

export const ROUTE_MAP: Record<string, string> = {
  Home: '#/',
  Settings: '#/settings',
  SettingsGeneral: '#/settings/general',
  SettingsAdvanced: '#/settings/advanced',
  SettingsNetworks: '#/settings/networks',
  SettingsSecurity: '#/settings/security',
  SettingsExperimental: '#/settings/experimental',
  SettingsAbout: '#/settings/about',
  SettingsContacts: '#/settings/contact-list',
  SendFlow: '#/send',
  ConfirmTransaction: '#/confirm-transaction',
  SwapFlow: '#/swaps',
  ImportToken: '#/import-token',
  ConnectHardware: '#/new-account/connect',
  RevealSRP: '#/settings/security/reveal-seed-words',
  PerpsHome: '#/?tab=perps',
  PerpsMarketDetails: '#/perps/market',
  PerpsOrderEntry: '#/perps/trade',
  PerpsMarketList: '#/perps/market-list',
};

/**
 * Look up an extension URL hash for a mobile route name.
 * Returns undefined if the route is not mapped.
 *
 * @param routeName - Mobile route name (e.g. "Home", "Settings")
 * @returns The extension URL hash, or undefined
 */
export function routeToHash(routeName: string): string | undefined {
  return ROUTE_MAP[routeName];
}
