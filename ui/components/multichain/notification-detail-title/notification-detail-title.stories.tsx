import React from 'react';
import { Meta } from '@storybook/react';

import {
  NotificationDetailTitle,
  NotificationDetailTitleProps,
} from './notification-detail-title';

export default {
  title:
    'Components/Multichain/Notification/NotificationDetail/NotificationDetailTitle',
  component: NotificationDetailTitle,
} as Meta;

const Template = (args: NotificationDetailTitleProps) => (
  <NotificationDetailTitle {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  title: 'Sent COMP',
  date: 'Aug 15, 2023 at 12:56 PM',
};
