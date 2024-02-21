import React from 'react';
import {
  BackgroundColor,
  BorderColor,
  Color,
} from '../../../helpers/constants/design-system';
import { BadgeStatus } from './badge-status';

export default {
  title: 'Components/Multichain/BadgeStatus',
  component: BadgeStatus,
  argTypes: {
    badgeBackgroundColor: {
      control: 'text',
    },
    badgeBorderColor: {
      control: 'text',
    },
    text: {
      control: 'text',
    },
    address: {
      control: 'text',
    },
    isConnectedAndNotActive: {
      control: 'boolean',
    },
  },
  args: {
    badgeBackgroundColor: BackgroundColor.successDefault,
    badgeBorderColor: BackgroundColor.backgroundDefault,
    address: '0x1',
    text: 'Tooltip',
  },
};

const Template = (args) => {
  return <BadgeStatus {...args} />;
};

export const DefaultStory = Template.bind({});

export const NotConnectedStory = Template.bind({});
NotConnectedStory.args = {
  badgeBackgroundColor: Color.borderMuted,
  badgeBorderColor: BackgroundColor.backgroundDefault,
};

export const ConnectedNotActiveStory = Template.bind({});
ConnectedNotActiveStory.args = {
  badgeBackgroundColor: BackgroundColor.backgroundDefault,
  badgeBorderColor: BorderColor.successDefault,
  isConnectedAndNotActive: true,
};
