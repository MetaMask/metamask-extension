import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import BlockieIdenticon from '../../ui/identicon/blockieIdenticon/blockieIdenticon.component';
import { AvatarBase } from '../avatar-base';

import { SIZES } from '../../../helpers/constants/design-system';
import { DIAMETERS, TYPES } from './avatar-account.constants';

export const AvatarAccount = ({ size, address, className, type, ...props }) => {
  return (
    <AvatarBase
      size={size}
      className={classnames('avatar-account', className)}
      {...props}
    >
      {type === 'Jazzicon' ? (
        <Jazzicon
          className={classnames('avatar-account__jazzicon')}
          address={address}
          diameter={DIAMETERS[size]}
        />
      ) : (
        <BlockieIdenticon
          address={address}
          diameter={DIAMETERS[size]}
          borderRadius="50%"
        />
      )}
    </AvatarBase>
  );
};

AvatarAccount.propTypes = {
  /**
   * The size of the AvatarAccount.
   * Possible values could be 'SIZES.XS', 'SIZES.SM', 'SIZES.MD', 'SIZES.LG', 'SIZES.XL'
   * Defaults to SIZES.MD
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The type of the avatar to be rendered, it can render either a Jazzicon or a Blockie
   */
  type: PropTypes.oneOf(Object.values(TYPES)),
  /**
   * Address used for generating random image
   */
  address: PropTypes.string,
  /**
   * Add custom css class
   */
  className: PropTypes.string,
};
