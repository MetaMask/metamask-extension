import React from 'react';
import { useState } from '@storybook/addons';
import { SIZES } from '../../../helpers/constants/design-system';
import { Icon, ICON_NAMES, ButtonLink, ButtonPrimary } from '..';
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
};

export const DefaultStory = (args) => {
  const onClose = () => console.log('BannerBase onClose trigger');
  return <BannerBase {...args} onClose={onClose} />;
};

DefaultStory.args = {
  title: 'Title is sentence case no period',
  children: "Description shouldn't repeat title. 1-3 lines.",
  actionButtonLabel: 'Action',
  startAccessory: <Icon name={ICON_NAMES.INFO_FILLED} size={SIZES.LG} />,
};

DefaultStory.storyName = 'Default';

export const Title = (args) => {
  return <BannerBase {...args} />;
};

Title.args = {
  title: 'Title is sentence case no period',
  children: 'Pass only a string through the title prop',
};

export const Children = (args) => {
  return (
    <BannerBase {...args}>
      {`Description shouldn't repeat title. 1-3 lines. Can contain a `}
      <ButtonLink size={SIZES.AUTO} href="https://metamask.io/" target="_blank">
        hyperlink.
      </ButtonLink>
    </BannerBase>
  );
};

export const ActionButton = (args) => {
  return <BannerBase {...args} />;
};

ActionButton.args = {
  title: 'Action prop demo',
  actionButtonLabel: 'Action',
  actionButtonOnClick: () => console.log('ButtonLink actionButtonOnClick demo'),
  actionButtonProps: {
    icon: ICON_NAMES.ARROW_2_RIGHT, // TODO: change to iconName
    iconPositionRight: true,
  },
  children:
    'Use actionButtonLabel for action text, actionButtonOnClick for the onClick handler, and actionButtonProps to pass any ButtonLink prop types such as iconName',
};

export const OnClose = (args) => {
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

export const StartAccessory = (args) => {
  return <BannerBase {...args} />;
};

StartAccessory.args = {
  title: 'Start accessory demo',
  children:
    'The info icon on the left is passed through the startAccessory prop',
  startAccessory: <Icon name={ICON_NAMES.INFO_FILLED} size={SIZES.LG} />,
};
