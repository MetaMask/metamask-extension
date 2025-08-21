import React from 'react';
import { Meta } from '@storybook/react';
import {
  NotificationsSettingsType,
  NotificationsSettingsTypeProps,
} from './notifications-settings-type';

export default {
  title:
    'Components/Multichain/NotificationsSettingsType',
  component: NotificationsSettingsType,
} as Meta;

const Template = (args: NotificationsSettingsTypeProps) => {
  return <NotificationsSettingsType {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  icon: 'Bank',
  title: 'Components/Multichain/NotificationsSettingsType',
  text: 'Receive notifications for transactions and events.',
};

export const WithoutIcon = Template.bind({});
WithoutIcon.args = {
  title: 'Components/Multichain/NotificationsSettingsType',
  text: 'Receive notifications for transactions and events.',
};

export const WithoutText = Template.bind({});
WithoutText.args = {
  icon: 'Bank',
  title: 'Components/Multichain/NotificationsSettingsType',
};

export const Minimal = Template.bind({});
Minimal.args = {
  title: 'Components/Multichain/NotificationsSettingsType',
};
