import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  COLORS,
  BORDER_COLORS,
  SIZES,
  DISPLAY,
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { Icon, ICON_NAMES } from '../icon';
import { AvatarBase } from '../avatar-base';

import { AVATAR_ICON_SIZES } from './avatar-icon.constants';

export const AvatarIcon = ({
  size = SIZES.MD,
  color = COLORS.PRIMARY_DEFAULT,
  backgroundColor = COLORS.PRIMARY_MUTED,
  className,
  iconProps,
  iconName,
  ...props
}) => {
  return (
    <AvatarBase
      size={size}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      color={color}
      backgroundColor={backgroundColor}
      borderColor={BORDER_COLORS.TRANSPARENT}
      className={classnames('mm-avatar-icon', className)}
      {...props}
    >
      <Icon color={COLORS.INHERIT} name={iconName} size={size} {...iconProps} />
    </AvatarBase>
  );
};

AvatarIcon.propTypes = {
  /**
   *
   * The name of the icon to display. Should be one of ICON_NAMES
   */
  iconName: PropTypes.oneOf(Object.values(ICON_NAMES)).isRequired,
  /**
   * Props for the icon inside AvatarIcon. All Icon props can be used
   */
  iconProps: PropTypes.shape(Icon.PropTypes),
  /**
   * The size of the AvatarIcon
   * Possible values could be 'SIZES.XS' 16px, 'SIZES.SM' 24px, 'SIZES.MD' 32px, 'SIZES.LG' 40px, 'SIZES.XL' 48px
   * Defaults to SIZES.MD
   */
  size: PropTypes.oneOf(Object.values(AVATAR_ICON_SIZES)),
  /**
   * The background color of the AvatarIcon
   * Defaults to COLORS.PRIMARY_MUTED
   */
  backgroundColor: Box.propTypes.backgroundColor,
  /**
   * The color of the text inside the AvatarIcon
   * Defaults to COLORS.PRIMARY_DEFAULT
   */
  color: Box.propTypes.color,
  /**
   * Additional classNames to be added to the AvatarIcon
   */
  className: PropTypes.string,
  /**
   * AvatarIcon also accepts all Box props including but not limited to
   * className, as(change root element of HTML element) and margin props
   */
  ...Box.propTypes,
};
