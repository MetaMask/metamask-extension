import React from 'react';
import { useState } from '@storybook/addons';
import {
  DISPLAY,
  FLEX_DIRECTION,
  SEVERITIES,
  SIZES,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { ICON_NAMES, ButtonLink, ButtonPrimary } from '..';
import README from './README.mdx';
import { Banner, BANNER_SEVERITIES } from '.';

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
  title: 'Components/ComponentLibrary/Banner',
  component: Banner,
  parameters: {
    docs: {
      page: README,
    },
    backgrounds: { default: 'alternative' },
  },
  argTypes: {
    severity: {
      options: Object.values(BANNER_SEVERITIES),
      control: 'select',
    },
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
  const onClose = () => console.log('Banner onClose trigger');
  return <Banner {...args} onClose={onClose} />;
};

DefaultStory.args = {
  title: 'Title is sentence case no period',
  children: "Description shouldn't repeat title. 1-3 lines.",
  actionButtonLabel: 'Action',
};

DefaultStory.storyName = 'Default';

export const Severity = (args) => {
  return (
    <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={3}>
      <Banner {...args} severity={SEVERITIES.INFO} title="Info">
        This is a demo of severity Info.
      </Banner>
      <Banner {...args} severity={SEVERITIES.WARNING} title="Warning">
        This is a demo of severity Warning.
      </Banner>
      <Banner {...args} severity={SEVERITIES.DANGER} title="Danger">
        This is a demo of severity Danger.
      </Banner>
      <Banner {...args} severity={SEVERITIES.SUCCESS} title="Success">
        This is a demo of severity Success.
      </Banner>
    </Box>
  );
};

export const Title = (args) => {
  return <Banner {...args} />;
};

Title.args = {
  title: 'Title is sentence case no period',
  children: 'Pass only a string through the title prop',
};

export const Children = (args) => {
  return (
    <Banner {...args}>
      {`Description shouldn't repeat title. 1-3 lines. Can contain a `}
      <ButtonLink size={SIZES.AUTO} href="https://metamask.io/" target="_blank">
        hyperlink.
      </ButtonLink>
    </Banner>
  );
};

export const ActionButton = (args) => {
  return <Banner {...args} />;
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
  const bannerToggle = () => {
    if (isShown) {
      console.log('close button clicked');
    }
    setShown(!isShown);
  };
  return (
    <>
      {isShown ? (
        <Banner {...args} onClose={bannerToggle} />
      ) : (
        <ButtonPrimary onClick={bannerToggle}>View Banner</ButtonPrimary>
      )}
    </>
  );
};

OnClose.args = {
  title: 'onClose demo',
  children: 'Click the close button icon to hide this notifcation',
};
