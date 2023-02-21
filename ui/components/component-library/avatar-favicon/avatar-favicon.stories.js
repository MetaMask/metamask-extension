import React from 'react';
import {
  DISPLAY,
  AlignItems,
  BorderColor,
  Size,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import README from './README.mdx';
import { AvatarFavicon, AVATAR_FAVICON_SIZES } from '.';

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
      options: Object.values(AVATAR_FAVICON_SIZES),
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
    size: Size.MD,
    name: 'Uniswap',
  },
};

const Template = (args) => {
  return <AvatarFavicon {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.baseline} gap={1}>
    <AvatarFavicon {...args} size={Size.XS} />
    <AvatarFavicon {...args} size={Size.SM} />
    <AvatarFavicon {...args} size={Size.MD} />
    <AvatarFavicon {...args} size={Size.LG} />
    <AvatarFavicon {...args} size={Size.XL} />
  </Box>
);
SizeStory.storyName = 'Size';

export const Src = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.flexStart} gap={1}>
    <AvatarFavicon {...args} src="https://uniswap.org/favicon.ico" />
    <AvatarFavicon
      {...args}
      src="https://1inch.exchange/assets/favicon/favicon-32x32.png"
    />
  </Box>
);
