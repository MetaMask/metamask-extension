import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import {
  Display,
  AlignItems,
  BorderColor,
} from '../../../helpers/constants/design-system';

import { Box } from '../box';

import README from './README.mdx';
import { AvatarFavicon, AvatarFaviconSize } from '.';

export default {
  title: 'Components/ComponentLibrary/AvatarFavicon',
  component: AvatarFavicon,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(AvatarFaviconSize),
    },
    src: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    borderColor: {
      options: Object.values(BorderColor),
      control: 'select',
    },
  },
  args: {
    src: 'https://uniswap.org/favicon.ico',
    size: AvatarFaviconSize.Md,
    name: 'Uniswap',
  },
} as Meta<typeof AvatarFavicon>;

const Template: StoryFn<typeof AvatarFavicon> = (args) => {
  return <AvatarFavicon {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory: StoryFn<typeof AvatarFavicon> = (args) => (
  <Box display={Display.Flex} alignItems={AlignItems.baseline} gap={1}>
    <AvatarFavicon {...args} size={AvatarFaviconSize.Xs} />
    <AvatarFavicon {...args} size={AvatarFaviconSize.Sm} />
    <AvatarFavicon {...args} size={AvatarFaviconSize.Md} />
    <AvatarFavicon {...args} size={AvatarFaviconSize.Lg} />
    <AvatarFavicon {...args} size={AvatarFaviconSize.Xl} />
  </Box>
);
SizeStory.storyName = 'Size';

export const Src: StoryFn<typeof AvatarFavicon> = (args) => (
  <Box display={Display.Flex} alignItems={AlignItems.flexStart} gap={1}>
    <AvatarFavicon {...args} src="https://uniswap.org/favicon.ico" />
    <AvatarFavicon
      {...args}
      src="https://1inch.exchange/assets/favicon/favicon-32x32.png"
    />
  </Box>
);
