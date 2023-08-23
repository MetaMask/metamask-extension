import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { Box } from '..';
import README from './README.mdx';
import { TagUrl } from './tag-url';

export default {
  title: 'Components/ComponentLibrary/TagUrl',
  component: TagUrl,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    label: {
      control: 'text',
    },
    src: {
      control: 'text',
    },
    actionButtonLabel: {
      control: 'text',
    },
    showLockIcon: {
      control: 'boolean',
    },
  },
  args: {
    label: 'app.uniswap.org',
    src: 'https://uniswap.org/favicon.ico',
    showLockIcon: true,
  },
} as Meta<typeof TagUrl>;

const Template = (args) => <TagUrl {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

DefaultStory.args = {
  actionButtonLabel: 'Permissions',
};

export const ActionButtonLabel: StoryFn<typeof TagUrl> = (args) => (
  <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
    <TagUrl {...args} />
    <TagUrl {...args} actionButtonLabel="Action" />
    <TagUrl {...args} actionButtonLabel="Click" />
  </Box>
);

ActionButtonLabel.args = {
  actionButtonLabel: 'Permissions',
  actionButtonProps: {
    externalLink: true,
    href: 'https://metamask.io',
  },
};

export const ShowLockIcon: StoryFn<typeof TagUrl> = (args) => (
  <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
    <TagUrl
      {...args}
      label="app.uniswap.org"
      src="https://uniswap.org/favicon.ico"
      showLockIcon
    />
    <TagUrl
      {...args}
      label="http://notsecure.com"
      src=""
      showLockIcon={false}
    />
  </Box>
);

export const Src: StoryFn<typeof TagUrl> = (args) => (
  <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
    <TagUrl
      {...args}
      label="app.uniswap.org"
      src="https://uniswap.org/favicon.ico"
    />
    <TagUrl
      {...args}
      label="metamask.github.io"
      src="https://metamask.github.io/test-dapp/metamask-fox.svg"
    />
    <TagUrl
      {...args}
      label="1inch.exchange"
      src="https://1inch.exchange/assets/favicon/favicon-32x32.png"
    />
    <TagUrl label="fallback" src="" />
  </Box>
);

export const Label: StoryFn<typeof TagUrl> = (args) => (
  <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
    <TagUrl {...args} />
    <TagUrl
      {...args}
      label="metamask.github.io"
      src="https://metamask.github.io/test-dapp/metamask-fox.svg"
    />
    <TagUrl {...args} src="" label="metamask.github.io" />
  </Box>
);
