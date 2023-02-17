import React, { useState } from 'react';
import {
  DISPLAY,
  FLEX_DIRECTION,
  Size,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { ButtonLink, ButtonPrimary, ICON_NAMES } from '..';
import README from './README.mdx';
import { BannerTip, BANNER_TIP_LOGOS } from '.';

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
  title: 'Components/ComponentLibrary/BannerTip',
  component: BannerTip,
  parameters: {
    docs: {
      page: README,
    },
    backgrounds: { default: 'alternative' },
  },
  argTypes: {
    logoType: {
      options: Object.values(BANNER_TIP_LOGOS),
      control: 'select',
    },
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
  const onClose = () => console.log('BannerTip onClose trigger');
  return <BannerTip {...args} onClose={onClose} />;
};

DefaultStory.args = {
  title: 'Title is sentence case no period',
  children: "Description shouldn't repeat title. 1-3 lines.",
  actionButtonLabel: 'Action',
};

DefaultStory.storyName = 'Default';

export const Type = (args) => {
  return (
    <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={3}>
      <BannerTip {...args} logoType={BANNER_TIP_LOGOS.INFO} title="Info">
        This is a demo of info.
      </BannerTip>
      <BannerTip {...args} logoType={BANNER_TIP_LOGOS.EMPTY} title="Warning">
        This is a demo of empty.
      </BannerTip>
    </Box>
  );
};

export const Title = (args) => {
  return <BannerTip {...args} />;
};

Title.args = {
  title: 'Title is sentence case no period',
  children: 'Pass only a string through the title prop',
};

export const Description = (args) => {
  return <BannerTip {...args} />;
};

Description.args = {
  title: 'Description vs children',
  description:
    'Pass only a string through the description prop or you can use children if the contents require more',
};

export const Children = (args) => {
  return (
    <BannerTip {...args}>
      {`Description shouldn't repeat title. 1-3 lines. Can contain a `}
      <ButtonLink size={Size.auto} href="https://metamask.io/" target="_blank">
        hyperlink.
      </ButtonLink>
    </BannerTip>
  );
};

export const ActionButton = (args) => {
  return <BannerTip {...args} />;
};

ActionButton.args = {
  title: 'Action prop demo',
  actionButtonLabel: 'Action',
  actionButtonOnClick: () => console.log('ButtonLink actionButtonOnClick demo'),
  actionButtonProps: {
    iconName: ICON_NAMES.ARROW_2_RIGHT,
    iconPositionRight: true,
  },
  children:
    'Use actionButtonLabel for action text, actionButtonOnClick for the onClick handler, and actionButtonProps to pass any ButtonLink prop types such as iconName',
};

export const OnClose = (args) => {
  const [isShown, setShown] = useState(true);
  const bannerTipToggle = () => {
    if (isShown) {
      console.log('close button clicked');
    }
    setShown(!isShown);
  };
  return (
    <>
      {isShown ? (
        <BannerTip {...args} onClose={bannerTipToggle} />
      ) : (
        <ButtonPrimary onClick={bannerTipToggle}>View BannerTip</ButtonPrimary>
      )}
    </>
  );
};

OnClose.args = {
  title: 'onClose demo',
  children: 'Click the close button icon to hide this notifcation',
};
