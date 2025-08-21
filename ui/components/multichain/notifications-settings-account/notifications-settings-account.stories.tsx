import React from 'react';
import { Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';
import {
  NotificationsSettingsAccount,
  NotificationsSettingsAccountProps,
} from './notifications-settings-account';

export default {
  title:
    'Components/Multichain/NotificationsSettingsAccount',
  component: NotificationsSettingsAccount,
} as Meta;

const Template = (args: NotificationsSettingsAccountProps) => {
  return <NotificationsSettingsAccount {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  address: '0x7830c87C02e56AFf27FA8Ab1241711331FA86F43',
  name: 'Account Name',
};
