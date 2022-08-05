import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';

export const BaseAvatar = ({
  size = SIZES.MD,
  children,
  backgroundColor = COLORS.BACKGROUND_ALTERNATIVE,
  borderColor = COLORS.BORDER_DEFAULT,
  ...props
}) => (
  <Box
    className={classnames('base-avatar', `base-avatar--size-${size}`)}
    {...{ backgroundColor, borderColor, ...props }}
  >
    {children}
  </Box>
);

BaseAvatar.propTypes = {
  /**
   * The size of the BaseAvatar.
   * Possible values could be 'xs', 'sm', 'md', 'lg', 'xl',
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The children to be rendered inside the BaseAvatar
   */
  children: PropTypes.node,
  /**
   * The background color of the BaseAvatar
   */
  backgroundColor: Box.propTypes.backgroundColor,
  /**
   * The background color of the BaseAvatar
   */
  borderColor: Box.propTypes.borderColor,
  /**
   * BaseAvatar accepts all the props from Box
   */
  ...Box.propTypes,
};
