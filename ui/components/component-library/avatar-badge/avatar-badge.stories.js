import React from 'react';

import { AvatarToken } from '../avatar-token';

import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import { AvatarNetwork } from '../avatar-network';
// import README from './README.mdx';
import { AvatarWithBadge, badgePositions } from './avatar-badge';

export default {
  title: 'Components/ComponentLibrary/AvatarWithBadge',
  id: __filename,
  component: AvatarWithBadge,
  // parameters: {
  //   docs: {
  //     page: README,
  //   },
  // },
  argTypes: {
    address: { control: 'text' },
    badgePosition: { options: badgePositions, control: 'select' },
  },
  args: {
    badgeProps: {
      tokenName: 'ast',
      tokenImageUrl: './AST.png',
      networkName: 'Arbitrum One',
      networkImageUrl: './images/arbitrum.svg',
    },
    address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    badgePosition: badgePositions.top,
  },
};

export const DefaultStory = (args) => (
  <AvatarWithBadge {...args} BadgeVariant={AvatarNetwork}>
    <Jazzicon address={args.address} />
  </AvatarWithBadge>
);

DefaultStory.storyName = 'Default';

export const AvatarTokenBadge = (args) => (
  <AvatarWithBadge {...args} BadgeVariant={AvatarToken}>
    <Jazzicon address={args.address} />
  </AvatarWithBadge>
);

AvatarTokenBadge.storyName = 'Avatar Token Badge';
