import React from 'react';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import NotificationsSettingsContent from '../../notifications-settings/notifications-settings';
import { SettingsTab } from '../shared';
import { SettingItemConfig } from '../types';

const NOTIFICATIONS_SETTING_ITEMS: SettingItemConfig[] = [
  { id: 'notifications', component: NotificationsSettingsContent },
];

const NotificationsTab = () => {
  return <SettingsTab items={NOTIFICATIONS_SETTING_ITEMS} />;
};

export default NotificationsTab;
