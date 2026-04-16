import React from 'react';
import { SettingsTab } from '../shared';
import { SettingItemConfig } from '../types';
import DebugTabContent from './debug-tab-content';

const DEBUG_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'debug', component: DebugTabContent },
];

const DebugTab = () => {
  return <SettingsTab items={DEBUG_SETTING_ITEMS} />;
};

export default DebugTab;
