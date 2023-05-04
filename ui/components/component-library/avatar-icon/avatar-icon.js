import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  BorderColor,
  Size,
  DISPLAY,
  AlignItems,
  JustifyContent,
  BackgroundColor,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { IconName, Icon } from '../icon';
import { AvatarBase } from '../avatar-base';

import { AVATAR_ICON_SIZES } from './avatar-icon.constants';

export const AvatarIcon = React.forwardRef(
  (
    {
      size = Size.MD,
      color = TextColor.primaryDefault,
      backgroundColor = BackgroundColor.primaryMuted,
      className,
      iconProps,
      iconName,
      ...props
    },
    ref,
  ) => (
    <AvatarBase
      ref={ref}
      size={size}
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      color={color}
      backgroundColor={backgroundColor}
      borderColor={BorderColor.transparent}
      className={classnames('mm-avatar-icon', className)}
      {...props}
    >
      <Icon
        color={IconColor.inherit}
        name={iconName}
        size={size}
        {...iconProps}
      />
    </AvatarBase>
  ),
);

AvatarIcon.propTypes = {
  /**
   *
   * The name of the icon to display. Should be one of IconName
   */
  iconName: PropTypes.oneOf(Object.values(IconName)).isRequired,
  /**
   * Props for the icon inside AvatarIcon. All Icon props can be used
   */
  iconProps: PropTypes.object,
  /**
   * The size of the AvatarIcon
   * Possible values could be 'SIZES.XS' 16px, 'SIZES.SM' 24px, 'SIZES.MD' 32px, 'SIZES.LG' 40px, 'SIZES.XL' 48px
   * Defaults to SIZES.MD
   */
  size: PropTypes.oneOf(Object.values(AVATAR_ICON_SIZES)),
  /**
   * The background color of the AvatarIcon
   * Defaults to BackgroundColor.primaryMuted
   */
  backgroundColor: PropTypes.oneOf(Object.values(BackgroundColor)),
  /**
   * The color of the text inside the AvatarIcon
   * Defaults to TextColor.primaryDefault
   */
  color: PropTypes.oneOf([
    ...Object.values(TextColor),
    ...Object.values(IconColor),
  ]),
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

AvatarIcon.displayName = 'AvatarIcon';
