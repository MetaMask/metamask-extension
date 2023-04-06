import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  DISPLAY,
  IconColor,
  JustifyContent,
  Size,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';
import { Icon, IconName } from '../icon';

import { BUTTON_ICON_SIZES } from './button-icon.constants';

export const ButtonIcon = ({
  ariaLabel,
  as = 'button',
  className,
  color = IconColor.iconDefault,
  href,
  size = Size.LG,
  iconName,
  disabled,
  iconProps,
  ...props
}) => {
  const Tag = href ? 'a' : as;
  return (
    <Box
      aria-label={ariaLabel}
      as={Tag}
      className={classnames(
        'mm-button-icon',
        `mm-button-icon--size-${size}`,
        {
          'mm-button-icon--disabled': disabled,
        },
        className,
      )}
      color={color}
      disabled={disabled}
      display={DISPLAY.INLINE_FLEX}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.LG}
      backgroundColor={BackgroundColor.transparent}
      href={href}
      {...props}
    >
      <Icon name={iconName} size={size} {...iconProps} />
    </Box>
  );
};

ButtonIcon.propTypes = {
  /**
   *  String that adds an accessible name for ButtonIcon
   */
  ariaLabel: PropTypes.string.isRequired,
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   */
  as: PropTypes.string,
  /**
   * An additional className to apply to the ButtonIcon.
   */
  className: PropTypes.string,
  /**
   * The color of the ButtonIcon component should use the IconColor object from
   * ./ui/helpers/constants/design-system.js
   */
  color: PropTypes.oneOf(Object.values(IconColor)),
  /**
   * Boolean to disable button
   */
  disabled: PropTypes.bool,
  /**
   * When an `href` prop is passed, ButtonIcon will automatically change the root element to be an `a` (anchor) tag
   */
  href: PropTypes.string,
  /**
   * The name of the icon to display. Should be one of IconName
   */
  iconName: PropTypes.oneOf(Object.values(IconName)).isRequired,
  /**
   * iconProps accepts all the props from Icon
   */
  iconProps: PropTypes.object,
  /**
   * The size of the ButtonIcon.
   * Possible values could be 'Size.SM' 24px, 'Size.LG' 32px,
   */
  size: PropTypes.oneOf(Object.values(BUTTON_ICON_SIZES)),
  /**
   * ButtonIcon accepts all the props from Box
   */
  ...Box.propTypes,
};
