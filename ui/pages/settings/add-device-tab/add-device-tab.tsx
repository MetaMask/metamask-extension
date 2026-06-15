import React from 'react';
import { SettingsTab } from '../shared';
import { SettingItemConfig } from '../types';
import AddDeviceSettings from './add-device-settings';

const ADD_DEVICE_TAB_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'add-device', component: AddDeviceSettings },
];

const AddDeviceTab = () => {
  return <SettingsTab items={ADD_DEVICE_TAB_SETTING_ITEMS} />;
};

export default AddDeviceTab;
