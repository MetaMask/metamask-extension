import React from 'react';
import Box from '../../ui/box/box';
import {
  AlignItems,
  DISPLAY,
  Size,
} from '../../../helpers/constants/design-system';
import { AvatarAccount } from './avatar-account';
import {
  AVATAR_ACCOUNT_TYPES,
  AVATAR_ACCOUNT_SIZES,
} from './avatar-account.constants';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/AvatarAccount',

  component: AvatarAccount,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(AVATAR_ACCOUNT_SIZES),
    },
    address: { control: 'text' },
    type: {
      control: 'select',
      options: Object.values(AVATAR_ACCOUNT_TYPES),
    },
  },
  args: {
    address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    size: Size.MD,
    type: AVATAR_ACCOUNT_TYPES.JAZZICON,
  },
};

export const DefaultStory = (args) => <AvatarAccount {...args} />;

DefaultStory.storyName = 'Default';

export const SizeStory = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.baseline} gap={1}>
    <AvatarAccount {...args} size={Size.XS} />
    <AvatarAccount {...args} size={Size.SM} />
    <AvatarAccount {...args} size={Size.MD} />
    <AvatarAccount {...args} size={Size.LG} />
    <AvatarAccount {...args} size={Size.XL} />
  </Box>
);
SizeStory.storyName = 'Size';

export const Type = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.baseline} gap={1}>
    <AvatarAccount {...args} type={AVATAR_ACCOUNT_TYPES.JAZZICON} />
    <AvatarAccount {...args} type={AVATAR_ACCOUNT_TYPES.BLOCKIES} />
  </Box>
);

export const Address = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.BASELINE} gap={1}>
    <AvatarAccount
      {...args}
      type={AVATAR_ACCOUNT_TYPES.JAZZICON}
      address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
    />
    <AvatarAccount
      {...args}
      type={AVATAR_ACCOUNT_TYPES.BLOCKIES}
      address="0x0"
    />
  </Box>
);
