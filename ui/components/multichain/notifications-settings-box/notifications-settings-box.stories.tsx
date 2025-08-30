import React from 'react';
import { Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';
import { IconName } from '../../component-library';
import {
  NotificationsSettingsBox,
  NotificationsSettingsBoxProps,
} from './notifications-settings-box';
import { NotificationsSettingsType } from '../notifications-settings-type';
import { NotificationsSettingsAccount } from '../notifications-settings-account';

export default {
  title: 'Components/Multichain/NotificationsSettingsBox',
  component: NotificationsSettingsBox,
} as Meta;

const Template = (args: NotificationsSettingsBoxProps) => {
  const [{ value }, updateArgs] = useArgs();
  const handleOnToggle = () => {
    updateArgs({ value: !value });
  };
  return (
    <NotificationsSettingsBox {...args} value={value} onToggle={handleOnToggle}>
      {args.children}
    </NotificationsSettingsBox>
  );
};

export const Default = Template.bind({});
Default.args = {
  children: (
    <NotificationsSettingsType
      icon={IconName.Bank}
      title="Enable Notifications"
      text="Receive notifications for transactions and events."
    />
  ),
  value: true,
  disabled: false,
  onToggle: () => console.log('Toggled'),
};

export const WithAccount = Template.bind({});
WithAccount.args = {
  children: (
    <NotificationsSettingsAccount
      address="0x7830c87C02e56AFf27FA8Ab1241711331FA86F43"
      name="Account Name"
    />
  ),
  value: true,
  disabled: false,
  onToggle: () => console.log('Toggled'),
};

export const WithoutIcon = Template.bind({});
WithoutIcon.args = {
  children: (
    <NotificationsSettingsType
      title="Enable Notifications"
      text="Receive notifications for transactions and events."
    />
  ),
  value: true,
  disabled: false,
  onToggle: () => console.log('Toggled'),
};

export const WithoutText = Template.bind({});
WithoutText.args = {
  children: (
    <NotificationsSettingsType
      icon={IconName.Bank}
      title="Enable Notifications"
    />
  ),
  value: true,
  disabled: false,
  onToggle: () => console.log('Toggled'),
};

export const Minimal = Template.bind({});
Minimal.args = {
  children: <NotificationsSettingsType title="Enable Notifications" />,
  value: true,
  disabled: false,
  onToggle: () => console.log('Toggled'),
};

export const ToggleDisabled = Template.bind({});
ToggleDisabled.args = {
  children: (
    <NotificationsSettingsType
      icon={IconName.Bank}
      title="Enable Notifications"
      text="Receive notifications for transactions and events."
    />
  ),
  value: true,
  disabled: true,
  onToggle: () => console.log('Toggled'),
};
