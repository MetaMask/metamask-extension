import React from 'react';
import { Box } from '@metamask/design-system-react';
import { ThemeItem } from './theme-item';
import { LanguageItem } from './language-item';
import { AccountIdenticonItem } from './account-identicon-item';
import { ShowExtensionItem } from './show-extension-item';
import { ManageInstitutionalWalletItem } from './manage-institutional-wallet-item';
import { ShowDefaultAddressItem } from './show-default-address-item';

type SettingItemConfig = {
  id: string;
  component: React.FC;
};

/** Registry of setting items for the Preferences and Display page. Add new items here */
const PREFERENCES_AND_DISPLAY_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'theme', component: ThemeItem },
  { id: 'language', component: LanguageItem },
  { id: 'account-identicon', component: AccountIdenticonItem },
  { id: 'show-default-address', component: ShowDefaultAddressItem },
  { id: 'show-extension', component: ShowExtensionItem },
  {
    id: 'manage-institutional-wallet',
    component: ManageInstitutionalWalletItem,
  },
];

export const PreferencesAndDisplay = ({
  children,
}: {
  children: SettingItemConfig[];
}) => {
  return (
    <Box>
      {children.map(({ id, component: Component }) => (
        <Component key={id} />
      ))}
    </Box>
  );
};

const PreferencesAndDisplayList = () => (
  <PreferencesAndDisplay>
    {PREFERENCES_AND_DISPLAY_SETTING_ITEMS}
  </PreferencesAndDisplay>
);

export default PreferencesAndDisplayList;
