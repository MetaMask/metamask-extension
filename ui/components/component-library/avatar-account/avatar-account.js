import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { BaseAvatar } from '../base-avatar';

import { SIZES } from '../../../helpers/constants/design-system';

export const diameters = {
  xs: '16',
  sm: '24',
  md: '32',
  lg: '40',
  xl: '48',
};

export const AvatarAccount = ({
  children,
  size,
  className,
  ...props
}) => {
  return (
    <BaseAvatar
      size={size}
      className={classnames('avatar-account', className)}
      {...props}
    >
      {children}
    </BaseAvatar>
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
   * The children to be rendered inside the AvatarAccount
   */
  children: PropTypes.node,
  /**
   * Address used for generating random image
   */
  address: PropTypes.string,
  /**
   * Add custom css class
   */
  className: PropTypes.string,
};
