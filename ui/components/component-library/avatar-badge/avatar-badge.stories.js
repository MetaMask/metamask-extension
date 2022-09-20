import React from 'react';
import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import { AvatarNetwork } from '../avatar-network';
import Box from '../../ui/box/box';
import {
  ALIGN_ITEMS,
  DISPLAY,
  SIZES,
} from '../../../helpers/constants/design-system';
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
        size={SIZES.XS}
        networkName="Arbitrum One"
        networkImageUrl="./images/arbitrum.svg"
      />
    }
  >
    <Jazzicon
      address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
      diameter={32}
    />
  </AvatarWithBadge>
);
DefaultStory.storyName = 'Default';

export const BadgePositions = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <AvatarWithBadge
      {...args}
      badgePosition="bottom"
      badge={
        <AvatarNetwork
          size={SIZES.XS}
          networkName="Arbitrum One"
          networkImageUrl="./images/arbitrum.svg"
        />
      }
    >
      <Jazzicon
        address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
        diameter={32}
      />
    </AvatarWithBadge>

    <AvatarWithBadge
      {...args}
      badgePosition="top"
      badge={
        <AvatarNetwork
          size={SIZES.XS}
          networkName="Arbitrum One"
          networkImageUrl="./images/arbitrum.svg"
        />
      }
    >
      <Jazzicon
        address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
        diameter={32}
      />
    </AvatarWithBadge>
  </Box>
);
