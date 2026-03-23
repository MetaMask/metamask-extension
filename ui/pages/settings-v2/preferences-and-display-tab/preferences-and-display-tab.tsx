import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem, createSelectItem } from '../shared';
import {
  getManageInstitutionalWallets,
  getShowExtensionInFullSizeView,
  getTheme,
} from '../../../selectors';
import {
  setManageInstitutionalWallets,
  setShowExtensionInFullSizeView,
} from '../../../store/actions';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { ThemeType } from '../../../../shared/constants/preferences';
import { THEME_ROUTE, LANGUAGE_ROUTE } from '../../../helpers/constants/routes';
import type { MetaMaskReduxState } from '../../../store/store';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import locales from '../../../../app/_locales/index.json';
import { AccountIdenticonItem } from './account-identicon-item';
import { ShowDefaultAddressItem } from './show-default-address-item';
import { THEME_LABEL_MAP } from './theme-utils';

const localeMap = new Map(locales.map(({ code, name }) => [code, name]));

const ThemeItem = createSelectItem({
  name: 'ThemeItem',
  titleKey: 'theme',
  valueSelector: getTheme,
  formatValue: (theme, t) =>
    t(THEME_LABEL_MAP[theme as ThemeType] ?? THEME_LABEL_MAP[ThemeType.os]),
  route: THEME_ROUTE,
});

const LanguageItem = createSelectItem({
  name: 'LanguageItem',
  titleKey: 'language',
  valueSelector: (state: MetaMaskReduxState) => state.metamask.currentLocale,
  formatValue: (locale) => localeMap.get(locale) ?? locale,
  route: LANGUAGE_ROUTE,
});

const ShowExtensionItem = createToggleItem({
  name: 'ShowExtensionItem',
  titleKey: 'showExtensionInFullSizeView',
  descriptionKey: 'showExtensionInFullSizeViewDescription',
  selector: getShowExtensionInFullSizeView,
  action: setShowExtensionInFullSizeView,
  dataTestId: 'show-extension-in-full-size-view',
  trackEvent: {
    event: MetaMetricsEventName.SettingsUpdated,
    properties: (newValue) => ({
      /* eslint-disable @typescript-eslint/naming-convention */
      settings_group: 'preferences_and_display',
      settings_type: 'open_full_screen',
      old_value: !newValue,
      new_value: newValue,
      open_full_screen: newValue,
      /* eslint-enable @typescript-eslint/naming-convention */
      location: 'Preferences and Display Settings',
    }),
  },
});

const ManageInstitutionalWalletItem = createToggleItem({
  name: 'ManageInstitutionalWalletItem',
  titleKey: 'manageInstitutionalWallets',
  descriptionKey: 'manageInstitutionalWalletsDescription',
  selector: getManageInstitutionalWallets,
  action: setManageInstitutionalWallets,
  dataTestId: 'manage-institutional-wallets',
});

/** Registry of setting items for the Preferences and Display page. Add new items here */
const PREFERENCES_AND_DISPLAY_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'theme', component: ThemeItem },
  { id: 'language', component: LanguageItem },
  { id: 'account-identicon', component: AccountIdenticonItem },
  { id: 'show-default-address', component: ShowDefaultAddressItem },
  {
    id: 'show-extension',
    component: ShowExtensionItem,
    hasDividerBefore: true,
  },
  {
    id: 'manage-institutional-wallet',
    component: ManageInstitutionalWalletItem,
  },
];

const PreferencesAndDisplayTab = () => (
  <SettingsTab items={PREFERENCES_AND_DISPLAY_SETTING_ITEMS} />
);

export default PreferencesAndDisplayTab;
