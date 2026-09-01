import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { BannerBase } from './banner-base';
import { Icon, IconName, IconSize } from '../icon';

export default {
  title: 'Components/ComponentLibrary/BannerBase (deprecated)',
  component: BannerBase,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use BannerBase from @metamask/design-system-react instead.',
      },
    },
    backgrounds: { default: 'alternative' },
  },
  argTypes: {
    className: {
      control: 'text',
    },
    title: {
      control: 'text',
    },
    titleProps: {
      control: 'object',
    },
    description: {
      control: 'text',
    },
    descriptionProps: {
      control: 'object',
    },
    children: {
      control: 'text',
    },
    childrenProps: {
      control: 'object',
    },
    actionButtonLabel: {
      control: 'text',
    },
    actionButtonOnClick: {
      action: 'actionButtonOnClick',
    },
    actionButtonProps: {
      control: 'object',
    },
    startAccessory: {
      control: 'text',
    },
    onClose: {
      action: 'onClose',
    },
  },
} as Meta<typeof BannerBase>;

const Template: StoryFn<typeof BannerBase> = (args) => <BannerBase {...args} />;

export const DefaultStory = Template.bind({});

DefaultStory.args = {
  title: 'Title is sentence case no period',
  children: "Description shouldn't repeat title. 1-3 lines.",
  actionButtonLabel: 'Action',
  startAccessory: <Icon name={IconName.Info} size={IconSize.Lg} />,
};

DefaultStory.storyName = 'Default';
