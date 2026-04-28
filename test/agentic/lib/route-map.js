'use strict';

/**
 * Mobile route names -> extension URL hash paths.
 * Used by the `navigate` action to translate mobile route names to extension URLs.
 */

const ROUTE_MAP = {
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

function routeToHash(routeName) {
  return ROUTE_MAP[routeName];
}

module.exports = { ROUTE_MAP, routeToHash };
