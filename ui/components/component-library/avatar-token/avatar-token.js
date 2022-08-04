import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { BaseAvatar } from '../base-avatar';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';

export const AvatarToken = ({
  children,
  size = SIZES.MD,
  backgroundColor = COLORS.BACKGROUND_ALTERNATIVE,
  borderColor = COLORS.BORDER_DEFAULT,
  ...props
}) => (
  <BaseAvatar
    size={size}
    className={classnames('avatar-token')}
    {...{ backgroundColor, borderColor, ...props }}
  >
    {children}
  </BaseAvatar>
);

AvatarToken.propTypes = {
  /**
   * The size of the BaseAvatar.
   * Possible values could be 'xs', 'sm', 'md', 'lg', 'xl',
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The children to be rendered inside the AvatarToken
   */
  children: PropTypes.node,
  /**
   * The background color of the AvatarToken
   */
  backgroundColor: BaseAvatar.propTypes.backgroundColor,
  /**
   * The background color of the AvatarToken
   */
  borderColor: BaseAvatar.propTypes.borderColor,
  /**
   * AvatarToken accepts all the props from BaseAvatar
   */
  ...BaseAvatar.propTypes,
};
