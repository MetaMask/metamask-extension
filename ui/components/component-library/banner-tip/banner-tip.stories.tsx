import React, { useState } from 'react';
import { Meta, StoryFn } from '@storybook/react';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import {
  ButtonLink,
  ButtonLinkSize,
  ButtonPrimary,
  Box,
  Icon,
  IconName,
} from '..';
import README from './README.mdx';
import { BannerTip, BannerTipLogoType } from '.';

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
      options: Object.values(BannerTipLogoType),
      control: 'select',
    },
    className: {
      control: 'text',
    },
  },
} as Meta<typeof BannerTip>;

const Template: StoryFn<typeof BannerTip> = (args) => <BannerTip {...args} />;

export const DefaultStory: StoryFn<typeof BannerTip> = (args) => {
  const onClose = () => console.log('BannerTip onClose trigger');
  return <BannerTip {...args} onClose={onClose} />;
};

DefaultStory.args = {
  title: 'Title is sentence case no period',
  children: "Description shouldn't repeat title. 1-3 lines.",
  actionButtonLabel: 'Action',
};

DefaultStory.storyName = 'Default';

export const LogoType: StoryFn<typeof BannerTip> = (args) => {
  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={3}>
      <BannerTip
        {...args}
        logoType={BannerTipLogoType.Greeting}
        title="Greeting"
      >
        This is a demo of greeting.
      </BannerTip>
      <BannerTip {...args} logoType={BannerTipLogoType.Chat} title="Chat">
        This is a demo of chat.
      </BannerTip>
    </Box>
  );
};

export const Title = Template.bind({});

Title.args = {
  title: 'Title is sentence case no period',
  children: 'Pass only a string through the title prop',
};

export const Description = Template.bind({});

Description.args = {
  title: 'Description vs children',
  description:
    'Pass only a string through the description prop or you can use children if the contents require more',
};

export const Children: StoryFn<typeof BannerTip> = (args) => {
  return (
    <BannerTip {...args}>
      Description shouldn&apos;t repeat title. 1-3 lines. Can contain a{' '}
      <ButtonLink
        size={ButtonLinkSize.Inherit}
        href="https://metamask.io/"
        externalLink
      >
        hyperlink.
      </ButtonLink>
    </BannerTip>
  );
};

export const ActionButton = Template.bind({});

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

export const OnClose: StoryFn<typeof BannerTip> = (args) => {
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

export const StartAccessory: StoryFn<typeof BannerTip> = (args) => {
  return (
    <BannerTip
      {...args}
      startAccessory={<Icon name={IconName.Messages} />}
      title="StartAccessory"
      onClose={() => console.log('close button clicked')}
    >
      This is a demo of startAccessory override.
    </BannerTip>
  );
};
