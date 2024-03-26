import React from 'react';
import { Meta } from '@storybook/react';

import {
  NotificationListSnapButton,
  NotificationListSnapButtonProps,
} from './notification-list-snap-button';

export default {
  title:
    'Components/Multichain/Notification/NotificationListItem/Components/NotificationListSnapButton',
  component: NotificationListSnapButton,
  argTypes: {
    items: {
      control: 'object',
    },
  },
} as Meta;

const Template = (args: NotificationListSnapButtonProps) => (
  <NotificationListSnapButton {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  text: 'Snap Text',
  onClick: () => console.log('Clicked'),
};
