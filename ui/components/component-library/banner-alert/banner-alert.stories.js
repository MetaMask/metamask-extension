import React from 'react';
import { useState } from '@storybook/addons';
import {
  DISPLAY,
  FLEX_DIRECTION,
  SEVERITIES,
  Size,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { ButtonLink, ButtonPrimary } from '..';
import { ICON_NAMES } from '../icon/deprecated';
import README from './README.mdx';
import { BannerAlert, BANNER_ALERT_SEVERITIES } from '.';

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
  title: 'Components/ComponentLibrary/BannerAlert',
  component: BannerAlert,
  parameters: {
    docs: {
      page: README,
    },
    backgrounds: { default: 'alternative' },
  },
  argTypes: {
    severity: {
      options: Object.values(BANNER_ALERT_SEVERITIES),
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
  const onClose = () => console.log('BannerAlert onClose trigger');
  return <BannerAlert {...args} onClose={onClose} />;
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
      <BannerAlert {...args} severity={SEVERITIES.INFO} title="Info">
        This is a demo of severity Info.
      </BannerAlert>
      <BannerAlert {...args} severity={SEVERITIES.WARNING} title="Warning">
        This is a demo of severity Warning.
      </BannerAlert>
      <BannerAlert {...args} severity={SEVERITIES.DANGER} title="Danger">
        This is a demo of severity Danger.
      </BannerAlert>
      <BannerAlert {...args} severity={SEVERITIES.SUCCESS} title="Success">
        This is a demo of severity Success.
      </BannerAlert>
    </Box>
  );
};

export const Title = (args) => {
  return <BannerAlert {...args} />;
};

Title.args = {
  title: 'Title is sentence case no period',
  children: 'Pass only a string through the title prop',
};

export const Description = (args) => {
  return <BannerAlert {...args} />;
};

Description.args = {
  title: 'Description vs children',
  description:
    'Pass only a string through the description prop or you can use children if the contents require more',
};

export const Children = (args) => {
  return (
    <BannerAlert {...args}>
      {`Description shouldn't repeat title. 1-3 lines. Can contain a `}
      <ButtonLink size={Size.auto} href="https://metamask.io/" target="_blank">
        hyperlink.
      </ButtonLink>
    </BannerAlert>
  );
};

export const ActionButton = (args) => {
  return <BannerAlert {...args} />;
};

ActionButton.args = {
  title: 'Action prop demo',
  actionButtonLabel: 'Action',
  actionButtonOnClick: () => console.log('ButtonLink actionButtonOnClick demo'),
  actionButtonProps: {
    endIconName: ICON_NAMES.ARROW_2_RIGHT,
  },
  children:
    'Use actionButtonLabel for action text, actionButtonOnClick for the onClick handler, and actionButtonProps to pass any ButtonLink prop types such as iconName',
};

export const OnClose = (args) => {
  const [isShown, setShown] = useState(true);
  const bannerAlertToggle = () => {
    if (isShown) {
      console.log('close button clicked');
    }
    setShown(!isShown);
  };
  return (
    <>
      {isShown ? (
        <BannerAlert {...args} onClose={bannerAlertToggle} />
      ) : (
        <ButtonPrimary onClick={bannerAlertToggle}>
          View BannerAlert
        </ButtonPrimary>
      )}
    </>
  );
};

OnClose.args = {
  title: 'onClose demo',
  children: 'Click the close button icon to hide this notifcation',
};
