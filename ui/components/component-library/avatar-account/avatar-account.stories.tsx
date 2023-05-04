import React from 'react';
import Box from '../../ui/box/box';
import { AlignItems, DISPLAY } from '../../../helpers/constants/design-system';
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
      options: Object.values(AvatarAccountSize).map(
        (value: AvatarAccountSize) => value.toLowerCase(),
      ),
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
};

export const DefaultStory: React.FC = (args) => <AvatarAccount {...args} />;

DefaultStory.storyName = 'Default';

export const Size: React.FC = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.baseline} gap={1}>
    <AvatarAccount {...args} size={AvatarAccountSize.Xs} />
    <AvatarAccount {...args} size={AvatarAccountSize.Sm} />
    <AvatarAccount {...args} size={AvatarAccountSize.Md} />
    <AvatarAccount {...args} size={AvatarAccountSize.Lg} />
    <AvatarAccount {...args} size={AvatarAccountSize.Xl} />
  </Box>
);

export const Variant: React.FC = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.baseline} gap={1}>
    <AvatarAccount {...args} variant={AvatarAccountVariant.Jazzicon} />
    <AvatarAccount {...args} variant={AvatarAccountVariant.Blockies} />
  </Box>
);

export const Address: React.FC = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.BASELINE} gap={1}>
    <AvatarAccount
      {...args}
      variant={AvatarAccountVariant.Jazzicon}
      address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
    />
    <AvatarAccount {...args} variant={AvatarAccountVariant.Blockies} address="0x0" />
  </Box>
);
