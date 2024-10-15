import React from 'react';
import {
  NotificationsList,
  type NotificationsListProps,
} from './notifications-list';
import { Meta } from '@storybook/react';

export default {
  title: 'Pages/Notifications/NotificationsListStates',
  component: NotificationsList,
  argTypes: {
    notifications: { table: { disable: true } },
    activeTab: { table: { disable: true } },
    notificationsCount: { table: { disable: true } },
  },
} as Meta;

const Template = (args: NotificationsListProps) => (
  <NotificationsList {...args} />
);

export const NoNotifications = Template.bind({});
NoNotifications.args = {
  notifications: [],
  isLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  notifications: [],
  isLoading: true,
};

export const Error = Template.bind({});
Error.args = {
  notifications: [],
  isError: true,
};
