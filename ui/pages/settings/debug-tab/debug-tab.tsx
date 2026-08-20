import React from 'react';
import { SettingsTab } from '../shared';
import { SettingItemConfig } from '../types';
import DebugContent from './debug-content';

const DEBUG_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'debug', component: DebugContent },
];

const DebugTab = () => {
  return <SettingsTab items={DEBUG_SETTING_ITEMS} />;
};

export default DebugTab;
