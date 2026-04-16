import React from 'react';
import InfoTab from '../../settings/info-tab/info-tab';
import { SettingsTab } from '../shared';
import { SettingItemConfig } from '../types';

const ABOUT_US_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'about-us', component: InfoTab },
];

const AboutTab = () => {
  return <SettingsTab items={ABOUT_US_SETTING_ITEMS} />;
};

export default AboutTab;
