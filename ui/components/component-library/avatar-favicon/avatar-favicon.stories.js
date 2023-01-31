import React from 'react';
import {
  SIZES,
  DISPLAY,
  ALIGN_ITEMS,
  BORDER_COLORS,
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
    borderColor: {
      options: Object.values(BORDER_COLORS),
      control: 'select',
    },
  },
  args: {
    src: 'https://uniswap.org/favicon.ico',
    size: SIZES.MD,
  },
};

const Template = (args) => {
  return <AvatarFavicon {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <AvatarFavicon {...args} size={SIZES.XS} />
    <AvatarFavicon {...args} size={SIZES.SM} />
    <AvatarFavicon {...args} size={SIZES.MD} />
    <AvatarFavicon {...args} size={SIZES.LG} />
    <AvatarFavicon {...args} size={SIZES.XL} />
  </Box>
);

export const Src = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.FLEX} gap={1}>
    <AvatarFavicon {...args} src="https://uniswap.org/favicon.ico" />
    <AvatarFavicon
      {...args}
      src="https://1inch.exchange/assets/favicon/favicon-32x32.png"
    />
  </Box>
);
