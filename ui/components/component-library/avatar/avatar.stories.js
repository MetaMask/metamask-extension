import React from 'react';
import { DISPLAY } from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
// import README from './README.mdx';
import { AvatarFaviconProps } from '../avatar-favicon/avatar-favicon.stories';
import { AvatarNetworkProps } from '../avatar-network/avatar-network.stories';
import { AvatarTokenProps } from '../avatar-token/avatar-token.stories';
import { AvatarAccountProps } from '../avatar-account/avatar-account.stories';

import { Avatar, AVATAR_TYPES } from '.';

export default {
  title: 'Components/ComponentLibrary/Avatar',
  id: __filename,
  component: Avatar,
};

export const Types = () => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <Avatar type={AVATAR_TYPES.ACCOUNT} {...AvatarAccountProps} />
    <Avatar type={AVATAR_TYPES.FAVICON} {...AvatarFaviconProps} />
    <Avatar type={AVATAR_TYPES.NETWORK} {...AvatarNetworkProps} />
    <Avatar type={AVATAR_TYPES.TOKEN} {...AvatarTokenProps} />
  </Box>
);
