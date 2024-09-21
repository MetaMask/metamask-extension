import React from 'react';
import { Meta } from '@storybook/react';
import {
  NotificationsSettingsType,
  NotificationsSettingsTypeProps,
} from './notifications-settings-type';

export default {
  title:
    'Components/Multichain/Notification/NotificationsSettingsBox/NotificationsSettingsType',
  component: NotificationsSettingsType,
} as Meta;

const Template = (args: NotificationsSettingsTypeProps) => {
  return <NotificationsSettingsType {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  icon: 'Bank',
  title: 'Enable Notifications',
  text: 'Receive notifications for transactions and events.',
};

export const WithoutIcon = Template.bind({});
WithoutIcon.args = {
  title: 'Enable Notifications',
  text: 'Receive notifications for transactions and events.',
};

export const WithoutText = Template.bind({});
WithoutText.args = {
  icon: 'Bank',
  title: 'Enable Notifications',
};

export const Minimal = Template.bind({});
Minimal.args = {
  title: 'Enable Notifications',
};
