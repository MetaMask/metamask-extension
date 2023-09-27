import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { useState } from '@storybook/addons';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { ButtonLink, ButtonPrimary, IconName, Box, ButtonLinkSize } from '..';

import README from './README.mdx';

import { BannerAlert, BannerAlertSeverity } from '.';

export default {
  title: 'Components/ComponentLibrary/BannerAlert',
  component: BannerAlert,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    severity: {
      control: 'select',
      options: Object.values(BannerAlertSeverity),
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
    actionButtonLabel: {
      control: 'text',
    },
    actionButtonOnClick: {
      action: 'actionButtonOnClick',
    },
    actionButtonProps: {
      control: 'object',
    },
    onClose: {
      action: 'onClose',
    },
  },
} as Meta<typeof BannerAlert>;

const Template: StoryFn<typeof BannerAlert> = (args) => (
  <BannerAlert {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  title: 'Title is sentence case no period',
  children: "Description shouldn't repeat title. 1-3 lines.",
  actionButtonLabel: 'Action',
};

export const SeverityStory: StoryFn<typeof BannerAlert> = (args) => {
  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={3}>
      <BannerAlert {...args} severity={BannerAlertSeverity.Info} title="Info">
        This is a demo of severity Info.
      </BannerAlert>
      <BannerAlert
        {...args}
        severity={BannerAlertSeverity.Warning}
        title="Warning"
      >
        This is a demo of severity Warning.
      </BannerAlert>
      <BannerAlert
        {...args}
        severity={BannerAlertSeverity.Danger}
        title="Danger"
      >
        This is a demo of severity Danger.
      </BannerAlert>
      <BannerAlert
        {...args}
        severity={BannerAlertSeverity.Success}
        title="Success"
      >
        This is a demo of severity Success.
      </BannerAlert>
    </Box>
  );
};
SeverityStory.storyName = 'Severity';

export const Title: StoryFn<typeof BannerAlert> = Template.bind({});
Title.args = {
  title: 'Title is sentence case no period',
  children: 'Pass only a string through the title prop',
};

export const Description: StoryFn<typeof BannerAlert> = Template.bind({});
Description.args = {
  title: 'Description vs children',
  description:
    'Pass only a string through the description prop or you can use children if the contents require more',
};

export const Children: StoryFn<typeof BannerAlert> = Template.bind({});
Children.args = {
  children: (
    <>
      {`Description shouldn't repeat title. 1-3 lines. Can contain a `}
      <ButtonLink
        size={ButtonLinkSize.Auto}
        href="https://metamask.io/"
        externalLink
      >
        hyperlink.
      </ButtonLink>
    </>
  ),
};

export const ActionButton: StoryFn<typeof BannerAlert> = Template.bind({});
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

export const OnClose: StoryFn<typeof BannerAlert> = (args) => {
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
