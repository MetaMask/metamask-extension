import React from 'react';
import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import BlockieIdenticon from '../../ui/identicon/blockieIdenticon/blockieIdenticon.component';
import { SIZES } from '../../../helpers/constants/design-system';
import { diameters, AvatarAccount } from './avatar-account';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/AvatarAccount',
  id: __filename,
  component: AvatarAccount,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(SIZES),
    },
    address: { control: 'text' },
  },
  args: {
    address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    size: SIZES.MD,
  },
};

export const DefaultStory = (args) => (
  <AvatarAccount {...args}>
    <Jazzicon address={args.address} />
  </AvatarAccount>
);

DefaultStory.storyName = 'Default';

export const BlockieStory = (args) => (
  <AvatarAccount {...args}>
    <BlockieIdenticon
      address={args.address}
      diameter={diameters[args.size]}
      borderRadius="50%"
    />
  </AvatarAccount>
);

BlockieStory.storyName = 'Blockie';
