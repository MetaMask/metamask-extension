import React from 'react';
import { AvatarAccount } from '../avatar-account';
import { TYPES } from '../avatar-account/avatar-account.constants';
import { AvatarNetwork } from '../avatar-network';
import Box from '../../ui/box/box';
import {
  ALIGN_ITEMS,
  DISPLAY,
  SIZES,
} from '../../../helpers/constants/design-system';
import { BADGE_POSITIONS } from './avatar-with-badge.constants';
import README from './README.mdx';
import { AvatarWithBadge } from './avatar-with-badge';

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
    badgePosition: {
      options: Object.values(BADGE_POSITIONS),
      control: 'select',
    },
  },
  args: {
    badgePosition: BADGE_POSITIONS.top,
  },
};

export const DefaultStory = (args) => (
  <AvatarWithBadge
    badge={
      <AvatarNetwork
        size={SIZES.XS}
        name="Arbitrum One"
        src="./images/arbitrum.svg"
      />
    }
    {...args}
  >
    <AvatarAccount
      address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
      size={SIZES.MD}
      type={TYPES.JAZZICON}
    />
  </AvatarWithBadge>
);
DefaultStory.storyName = 'Default';

export const BadgePosition = () => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <AvatarWithBadge
      badgePosition={BADGE_POSITIONS.BOTTOM}
      badge={
        <AvatarNetwork
          size={SIZES.XS}
          name="Arbitrum One"
          src="./images/arbitrum.svg"
        />
      }
    >
      <AvatarAccount
        address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
        size={SIZES.MD}
        type={TYPES.JAZZICON}
      />
    </AvatarWithBadge>

    <AvatarWithBadge
      badgePosition={BADGE_POSITIONS.TOP}
      badge={
        <AvatarNetwork
          size={SIZES.XS}
          name="Arbitrum One"
          src="./images/arbitrum.svg"
        />
      }
    >
      <AvatarAccount
        address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
        size={SIZES.MD}
        type={TYPES.JAZZICON}
      />
    </AvatarWithBadge>
  </Box>
);
