import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { useState } from '@storybook/addons';
import {
  ButtonLink,
  ButtonLinkSize,
  ButtonPrimary,
  Icon,
  IconName,
  IconSize,
} from '..';
import { BannerBase } from './banner-base';
import README from './README.mdx';

const marginSizeControlOptions = [
  undefined,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  'auto',
];

export default {
  title: 'Components/ComponentLibrary/BannerBase',
  component: BannerBase,
  parameters: {
    docs: {
      page: README,
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
    description: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    action: {
      control: 'func',
    },
    actionButtonLabel: {
      control: 'text',
    },
    actionButtonOnClick: {
      control: 'func',
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
    marginTop: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginRight: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginBottom: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginLeft: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
  },
} as Meta<typeof BannerBase>;

export const DefaultStory: StoryFn<typeof BannerBase> = (args) => {
  const onClose = () => console.log('BannerBase onClose trigger');
  return <BannerBase {...args} onClose={onClose} />;
};

DefaultStory.args = {
  title: 'Title is sentence case no period',
  children: "Description shouldn't repeat title. 1-3 lines.",
  actionButtonLabel: 'Action',
  startAccessory: <Icon name={IconName.Info} size={IconSize.Lg} />,
};

DefaultStory.storyName = 'Default';

export const Title: StoryFn<typeof BannerBase> = (args) => {
  return <BannerBase {...args} />;
};

Title.args = {
  title: 'Title is sentence case no period',
  children: 'Pass only a string through the title prop',
};

export const Description: StoryFn<typeof BannerBase> = (args) => {
  return <BannerBase {...args} />;
};

Description.args = {
  title: 'Description vs children',
  description:
    'Pass only a string through the description prop or you can use children if the contents require more',
};

export const Children: StoryFn<typeof BannerBase> = (args) => {
  return (
    <BannerBase {...args}>
      {`Description shouldn't repeat title. 1-3 lines. Can contain a `}
      <ButtonLink
        size={ButtonLinkSize.Inherit}
        href="https://metamask.io/"
        target="_blank"
      >
        hyperlink.
      </ButtonLink>
    </BannerBase>
  );
};

export const ActionButton: StoryFn<typeof BannerBase> = (args) => {
  return <BannerBase {...args} />;
};

ActionButton.args = {
  title: 'Action prop demo',
  actionButtonLabel: 'Action',
  actionButtonOnClick: () => console.log('ButtonLink actionButtonOnClick demo'),
  actionButtonProps: {
    endIconName: IconName.Arrow2Right,
  },
  children:
    'Use actionButtonLabel for action text, actionButtonOnClick for the onClick handler, and actionButtonProps to pass any ButtonLink prop types such as iconName',
};

export const OnClose: StoryFn<typeof BannerBase> = (args) => {
  const [isShown, setShown] = useState(true);
  const bannerToggle = () => {
    if (isShown) {
      console.log('close button clicked');
    }
    setShown(!isShown);
  };
  return (
    <>
      {isShown ? (
        <BannerBase {...args} onClose={bannerToggle} />
      ) : (
        <ButtonPrimary onClick={bannerToggle}>View BannerBase</ButtonPrimary>
      )}
    </>
  );
};

OnClose.args = {
  title: 'onClose demo',
  children: 'Click the close button icon to hide this notifcation',
};

export const StartAccessory: StoryFn<typeof BannerBase> = (args) => {
  return <BannerBase {...args} />;
};

StartAccessory.args = {
  title: 'Start accessory demo',
  children:
    'The info icon on the left is passed through the startAccessory prop',
  startAccessory: <Icon name={IconName.Info} size={IconSize.Lg} />,
};
