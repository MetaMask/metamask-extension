import React from 'react';
import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import { AvatarNetwork } from '../avatar-network';
import README from './README.mdx';
import { AvatarWithBadge, badgePositions } from './avatar-badge';

export default {
  title: 'Components/ComponentLibrary/AvatarWithBadge',
  id: __filename,
  component: AvatarWithBadge,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    badgePosition: { options: badgePositions, control: 'select' },
  },
  args: {
    badgePosition: badgePositions.top,
  },
};

export const DefaultStory = (args) => (
  <AvatarWithBadge
    {...args}
    badge={
      <AvatarNetwork
        networkName="Arbitrum One"
        networkImageUrl="./images/arbitrum.svg"
      />
    }
  >
    <Jazzicon address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" />
  </AvatarWithBadge>
);

DefaultStory.storyName = 'Default';
