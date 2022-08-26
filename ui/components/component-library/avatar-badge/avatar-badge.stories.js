import React from 'react';

import { AvatarToken } from '../avatar-token';

import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import { AvatarNetwork } from '../avatar-network';
// import README from './README.mdx';
import { AvatarBadge, badgePosition } from './avatar-badge';

export default {
  title: 'Components/ComponentLibrary/AvatarBadge',
  id: __filename,
  component: AvatarBadge,
  // parameters: {
  //   docs: {
  //     page: README,
  //   },
  // },
  argTypes: {
    address: { control: 'text' },
    badgePosition: { options: badgePosition, control: 'select' },
  },
  args: {
    badgeProps: {
      tokenName: 'ast',
      tokenImageUrl: './AST.png',
      networkName: 'Arbitrum One',
      networkImageUrl: './images/arbitrum.svg',
    },
    address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    badgePosition: badgePosition.top,
  },
};

export const DefaultStory = (args) => (
  <AvatarBadge {...args} BadgeVariant={AvatarNetwork}>
    <Jazzicon address={args.address} />
  </AvatarBadge>
);

DefaultStory.storyName = 'Default';

export const AvatarTokenBadge = (args) => (
  <AvatarBadge {...args} BadgeVariant={AvatarToken}>
    <Jazzicon address={args.address} />
  </AvatarBadge>
);

AvatarTokenBadge.storyName = 'Avatar Token Badge';
