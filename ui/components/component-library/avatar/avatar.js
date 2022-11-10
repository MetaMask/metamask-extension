import React from 'react';
import PropTypes from 'prop-types';
import { AvatarToken } from '../avatar-token';
import { AvatarAccount } from '../avatar-account';
import { AvatarFavicon } from '../avatar-favicon';
import { AvatarNetwork } from '../avatar-network';

import { AVATAR_TYPES } from './avatar.constants';

export const Avatar = ({ type, ...props }) => {
  switch (type) {
    case AVATAR_TYPES.ACCOUNT:
      return <AvatarAccount {...props} />;
    case AVATAR_TYPES.FAVICON:
      return <AvatarFavicon {...props} />;
    case AVATAR_TYPES.NETWORK:
      return <AvatarNetwork {...props} />;
    case AVATAR_TYPES.TOKEN:
      return <AvatarToken {...props} />;
    default:
      return <AvatarAccount {...props} />;
  }
};

Avatar.propTypes = {
  /**
   * Select the variant of Avatar.
   * Possible values could be 'AVATAR_TYPES.ACCOUNT', 'AVATAR_TYPES.FAVICON', 'AVATAR_TYPES.NETWORK', 'AVATAR_TYPES.TOKEN'
   */
  type: PropTypes.oneOf(Object.values(AVATAR_TYPES)),
};
