import React from 'react';
import Box from '../../ui/box/box';
import {
  ALIGN_ITEMS,
  DISPLAY,
  SIZES,
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
    size: SIZES.MD,
    type: AVATAR_ACCOUNT_TYPES.JAZZICON,
  },
};

export const DefaultStory = (args) => <AvatarAccount {...args} />;

DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <AvatarAccount {...args} size={SIZES.XS} />
    <AvatarAccount {...args} size={SIZES.SM} />
    <AvatarAccount {...args} size={SIZES.MD} />
    <AvatarAccount {...args} size={SIZES.LG} />
    <AvatarAccount {...args} size={SIZES.XL} />
  </Box>
);

export const Type = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <AvatarAccount {...args} type={AVATAR_ACCOUNT_TYPES.JAZZICON} />
    <AvatarAccount {...args} type={AVATAR_ACCOUNT_TYPES.BLOCKIES} />
  </Box>
);

export const Address = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
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
