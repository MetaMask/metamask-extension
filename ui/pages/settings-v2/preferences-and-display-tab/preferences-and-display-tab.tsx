import React from 'react';
import { Box } from '@metamask/design-system-react';
import { ThemeItem } from './theme-item';
import { LanguageItem } from './language-item';
import { AccountIdenticonItem } from './account-identicon-item';

/** Registry of setting items for the Preferences and Display page. Add new items here */
const PREFERENCES_AND_DISPLAY_SETTING_ITEMS: {
  id: string;
  component: React.FC;
}[] = [
  { id: 'theme', component: ThemeItem },
  { id: 'language', component: LanguageItem },
  { id: 'account-identicon', component: AccountIdenticonItem },
];

const PreferencesAndDisplay = () => {
  return (
    <Box>
      {PREFERENCES_AND_DISPLAY_SETTING_ITEMS.map(
        ({ id, component: Component }) => (
          <Component key={id} />
        ),
      )}
    </Box>
  );
};

export default PreferencesAndDisplay;
