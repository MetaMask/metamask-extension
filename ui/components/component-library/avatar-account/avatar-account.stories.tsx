import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Box } from '../box';
import { AlignItems, Display } from '../../../helpers/constants/design-system';
import { AvatarAccount } from './avatar-account';
import {
  AvatarAccountVariant,
  AvatarAccountSize,
} from './avatar-account.types';

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
      options: Object.values(AvatarAccountSize),
    },
    address: { control: 'text' },
    variant: {
      control: 'select',
      options: Object.values(AvatarAccountVariant),
    },
  },
  args: {
    address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    size: AvatarAccountSize.Md,
    variant: AvatarAccountVariant.Jazzicon,
  },
} as Meta<typeof AvatarAccount>;

export const DefaultStory = (args) => <AvatarAccount {...args} />;

DefaultStory.storyName = 'Default';

export const Size: StoryFn<typeof AvatarAccount> = (args) => (
  <Box display={Display.Flex} alignItems={AlignItems.baseline} gap={1}>
    <AvatarAccount {...args} size={AvatarAccountSize.Xs} />
    <AvatarAccount {...args} size={AvatarAccountSize.Sm} />
    <AvatarAccount {...args} size={AvatarAccountSize.Md} />
    <AvatarAccount {...args} size={AvatarAccountSize.Lg} />
    <AvatarAccount {...args} size={AvatarAccountSize.Xl} />
  </Box>
);

export const Variant: StoryFn<typeof AvatarAccount> = (args) => (
  <Box display={Display.Flex} alignItems={AlignItems.baseline} gap={1}>
    <AvatarAccount {...args} variant={AvatarAccountVariant.Jazzicon} />
    <AvatarAccount {...args} variant={AvatarAccountVariant.Blockies} />
  </Box>
);

export const Address: StoryFn<typeof AvatarAccount> = (args) => (
  <Box display={Display.Flex} alignItems={AlignItems.baseline} gap={1}>
    <AvatarAccount
      {...args}
      variant={AvatarAccountVariant.Jazzicon}
      address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
    />
    <AvatarAccount
      {...args}
      variant={AvatarAccountVariant.Blockies}
      address="0x0"
    />
  </Box>
);
