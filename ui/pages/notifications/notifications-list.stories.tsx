import React from 'react';
import {
  NotificationsList,
  type NotificationsListProps,
} from './notifications-list';
import { Meta } from '@storybook/react';
import { TAB_KEYS } from './notifications-list';

export default {
  title: 'Pages/Notifications/NotificationsListStates',
  component: NotificationsList,
  argTypes: {
    notifications: { table: { disable: true } },
    activeTab: { table: { disable: true } },
    notificationsCount: { table: { disable: true } },
  },
} as Meta;

const defaultArgs: NotificationsListProps = {
  activeTab: TAB_KEYS.ALL,
  notifications: [],
  isLoading: false,
  isError: false,
  notificationsCount: 0,
};

const Template = (args: NotificationsListProps) => (
  <NotificationsList {...args} />
);

export const NoNotifications = Template.bind({});
NoNotifications.args = {
  ...defaultArgs,
};

export const Loading = Template.bind({});
Loading.args = {
  ...defaultArgs,
  isLoading: true,
};

export const Error = Template.bind({});
Error.args = {
  ...defaultArgs,
  isError: true,
};
