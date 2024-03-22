import React from 'react';
import { Meta } from '@storybook/react';
import {
  NotificationDetailAddress,
  NotificationDetailAddressProps,
} from './notification-detail-address';

export default {
  title:
    'Components/Multichain/Notification/NotificationDetail/NotificationDetailAddress',
  component: NotificationDetailAddress,
} as Meta;

const Template = (args: NotificationDetailAddressProps) => (
  <NotificationDetailAddress {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  side: 'From (You)',
  address: '0x7830c87C02e56AFf27FA8Ab1241711331FA86F43',
};

export const ToStory = Template.bind({});
ToStory.args = {
  side: 'To',
  address: '0x55FE002aefF02F77364de339a1292923A15844B8',
};
