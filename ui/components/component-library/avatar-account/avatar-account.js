import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import BlockieIdenticon from '../../ui/identicon/blockieIdenticon/blockieIdenticon.component';

import Box from '../../ui/box/box';

import { AvatarBase } from '../avatar-base';
import {
  AvatarAccountDiameter,
  AvatarAccountVariant,
  AvatarAccountSize,
} from './avatar-account.types';

export const AvatarAccount = React.forwardRef(
  (
    {
      size = AvatarAccountSize.Md,
      address,
      className,
      variant = AvatarAccountVariant.Jazzicon,
      ...props
    },
    ref,
  ) => (
    <AvatarBase
      ref={ref}
      size={size}
      className={classnames('mm-avatar-account', className)}
      {...props}
    >
      {variant === AvatarAccountVariant.Jazzicon ? (
        <Jazzicon
          className={classnames('mm-avatar-account__jazzicon')}
          address={address}
          diameter={AvatarAccountDiameter[size]}
        />
      ) : (
        <BlockieIdenticon
          address={address}
          diameter={AvatarAccountDiameter[size]}
          borderRadius="50%"
        />
      )}
    </AvatarBase>
  ),
);

AvatarAccount.propTypes = {
  /**
   * The size of the AvatarAccount.
   * Possible values could be 'AvatarAccountSize.Xs', 'AvatarAccountSize.Sm', 'AvatarAccountSize.Md', 'AvatarAccountSize.Lg', 'AvatarAccountSize.Xl'
   * Defaults to AvatarAccountSize.Md
   */
  size: PropTypes.oneOf(Object.values(AvatarAccountSize)),
  /**
   * The variant of the avatar to be rendered, it can render either a AvatarAccountVariant.Jazzicon or a AvatarAccountVariant.Blockie
   */
  variant: PropTypes.oneOf(Object.values(AvatarAccountVariant)),
  /**
   * Address used for generating random image
   */
  address: PropTypes.string.isRequired,
  /**
   * Add custom css class
   */
  className: PropTypes.string,
  /**
   * AvatarAccount also accepts all Box props including but not limited to
   * className, as(change root element of HTML element) and margin props
   */
  ...Box.propTypes,
};

AvatarAccount.displayName = 'AvatarAccount';
