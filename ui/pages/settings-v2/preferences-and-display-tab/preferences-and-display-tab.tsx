import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab } from '../shared';
import { ThemeItem } from './theme-item';
import { LanguageItem } from './language-item';
import { AccountIdenticonItem } from './account-identicon-item';
import { ShowExtensionItem } from './show-extension-item';
import { ManageInstitutionalWalletItem } from './manage-institutional-wallet-item';
import { ShowDefaultAddressItem } from './show-default-address-item';

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
