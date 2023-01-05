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
import { AVATAR_WITH_BADGE_POSTIONS } from './avatar-with-badge.constants';
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
      options: Object.values(AVATAR_WITH_BADGE_POSTIONS),
      control: 'select',
    },
  },
  args: {
    badgePosition: AVATAR_WITH_BADGE_POSTIONS.top,
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
      badgePosition={AVATAR_WITH_BADGE_POSTIONS.BOTTOM}
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
      badgePosition={AVATAR_WITH_BADGE_POSTIONS.TOP}
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
