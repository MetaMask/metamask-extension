import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab, createToggleItem } from '../shared';
import {
  getManageInstitutionalWallets,
  getShowExtensionInFullSizeView,
} from '../../../selectors';
import {
  setManageInstitutionalWallets,
  setShowExtensionInFullSizeView,
} from '../../../store/actions';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { ThemeItem } from './theme-item';
import { LanguageItem } from './language-item';
import { AccountIdenticonItem } from './account-identicon-item';
import { ShowDefaultAddressItem } from './show-default-address-item';

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
