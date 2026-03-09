import React from 'react';
import { SettingItemConfig } from '../types';
import { SettingsTab } from '../shared';
import { BasicFunctionalityToggleItem } from './basic-functionality-item';

/** Registry of setting items for the Privacy page. Add new items here */
const PRIVACY_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'basic-functionality', component: BasicFunctionalityToggleItem },
];

const PrivacyTab = () => <SettingsTab items={PRIVACY_SETTING_ITEMS} />;

export default PrivacyTab;
