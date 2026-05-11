import React from 'react';
import { SettingsTab } from '../shared';
import { SettingItemConfig } from '../types';
import AboutInfo from './about-info';

const ABOUT_US_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'about-us', component: AboutInfo },
];

const AboutTab = () => {
  return <SettingsTab items={ABOUT_US_SETTING_ITEMS} />;
};

export default AboutTab;
