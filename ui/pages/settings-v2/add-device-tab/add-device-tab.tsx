import React from 'react';
import InfoTab from '../../settings/info-tab/info-tab';
import { SettingsTab } from '../shared';
import { SettingItemConfig } from '../types';

const ADD_DEVICE_TAB_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'add-device', component: InfoTab },
];

const AboutTab = () => {
  return <SettingsTab items={ADD_DEVICE_TAB_SETTING_ITEMS} />;
};

export default AboutTab;
