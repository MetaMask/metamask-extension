import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { useState } from '@storybook/addons';
import { BannerBase } from './banner-base';
import README from './README.mdx';
import { Icon, IconName, IconSize } from '../icon';
import { ButtonLink, ButtonLinkSize } from '../button-link';
import { ButtonPrimary } from '../button-primary';

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
  title: 'Components/ComponentLibrary/BannerBase',
  children: "Description shouldn't repeat title. 1-3 lines.",
  actionButtonLabel: 'Action',
  startAccessory: <Icon name={IconName.Info} size={IconSize.Lg} />,
};

DefaultStory.storyName = 'Default';

export const Title = Template.bind({});

Title.args = {
  title: 'Components/ComponentLibrary/BannerBase',
  children: 'Pass only a string through the title prop',
};

export const Description = Template.bind({});

Description.args = {
  title: 'Components/ComponentLibrary/BannerBase',
  description:
    'Pass only a string through the description prop or you can use children if the contents require more',
};

export const Children: StoryFn<typeof BannerBase> = (args) => {
  return (
    <BannerBase {...args}>
      Description shouldn't repeat title. 1-3 lines. Can contain a{' '}
      <ButtonLink
        size={ButtonLinkSize.Inherit}
        href="https://metamask.io/"
        externalLink
      >
        hyperlink
      </ButtonLink>
      .
    </BannerBase>
  );
};

export const ActionButton = Template.bind({});

ActionButton.args = {
  title: 'Components/ComponentLibrary/BannerBase',
  actionButtonLabel: 'Action',
  actionButtonProps: {
    endIconName: IconName.Arrow2Right,
  },
  children:
    'Use actionButtonLabel for action text, actionButtonOnClick for the onClick handler, and actionButtonProps to pass any ButtonLink prop types such as iconName',
};

export const OnClose: StoryFn<typeof BannerBase> = (args) => {
  const [isShown, setShown] = useState(true);
  const bannerToggle = () => setShown(!isShown);
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
  title: 'Components/ComponentLibrary/BannerBase',
  children: 'Click the close button icon to hide this notifcation',
};

export const StartAccessory = Template.bind({});

StartAccessory.args = {
  title: 'Components/ComponentLibrary/BannerBase',
  children:
    'The info icon on the left is passed through the startAccessory prop',
  startAccessory: <Icon name={IconName.Info} size={IconSize.Lg} />,
};
