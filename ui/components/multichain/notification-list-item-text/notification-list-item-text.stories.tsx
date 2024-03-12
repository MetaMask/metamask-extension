import React from 'react';
import { Meta } from '@storybook/react';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

import {
  NotificationListItemText,
  NotificationListItemTextProps,
} from './notification-list-item-text';

export default {
  title:
    'Components/Multichain/Notification/NotificationListItem/Components/NotificationListItemText',
  component: NotificationListItemText,
  argTypes: {
    items: {
      control: 'object',
      description:
        'An array of objects, each representing a notification item title. Each object should have a "text" field and an optional "highlighted" field.',
    },
    variant: {
      control: {
        type: 'select',
        options: Object.values(TextVariant),
      },
    },
  },
} as Meta;

const Template = (args: NotificationListItemTextProps) => (
  <NotificationListItemText {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  items: [
    {
      text: 'Lorem ipsum',
    },
    {
      text: 'dolor sit amet',
      highlighted: true,
    },
  ],
};

export const SingleItem = Template.bind({});
SingleItem.args = {
  items: [
    {
      text: 'Stake completed',
    },
  ],
  textProps: {
    variant: TextVariant.headingLg,
  },
};

export const TwoItems = Template.bind({});
TwoItems.args = {
  items: [
    {
      text: 'Received from',
    },
    {
      text: '0xe983b...3114',
      highlighted: true,
    },
  ],
};

export const ThreeItems = Template.bind({});
ThreeItems.args = {
  items: [
    {
      text: 'Swapped',
    },
    {
      text: 'USDC',
      highlighted: true,
    },
    {
      text: 'for',
    },
  ],
};

export const FourItems = Template.bind({});
FourItems.args = {
  items: [
    {
      text: 'Bridged from',
    },
    {
      text: 'ethereum',
      highlighted: true,
    },
    {
      text: 'to',
    },
    {
      text: 'polygon',
      highlighted: true,
    },
  ],
};

export const BodyMedium = Template.bind({});
BodyMedium.args = {
  items: [
    {
      text: 'Lorem ipsum',
    },
    {
      text: 'dolor sit amet',
      highlighted: true,
    },
  ],
  variant: TextVariant.bodyMd,
};

export const AlternativeColor = Template.bind({});
AlternativeColor.args = {
  items: [
    {
      text: 'Lorem ipsum',
    },
    {
      text: 'dolor sit amet',
      highlighted: true,
    },
  ],
  color: TextColor.textAlternative,
};
