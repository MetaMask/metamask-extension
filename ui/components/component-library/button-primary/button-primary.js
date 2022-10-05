import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonBase } from '../button-base';
import { BUTTON_SIZES } from './button-primary.constants';

export const ButtonPrimary = ({
  as = 'button',
  block,
  children,
  className,
  danger,
  size = BUTTON_SIZES.MD,
  icon,
  iconPositionRight,
  loading,
  disabled,
  iconProps,
  ...props
}) => {
  return (
    <ButtonBase
      className={classnames(className, 'mm-button-primary', {
        'mm-button-primary--type-danger': danger,
      })}
      {...props}
    >
      {children}
    </ButtonBase>
  );
};

ButtonPrimary.propTypes = {
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   */
  as: PropTypes.string,
  /**
   * Boolean prop to quickly activate box prop display block
   */
  block: PropTypes.bool,
  /**
   * The children to be rendered inside the ButtonBase
   */
  children: PropTypes.node,
  /**
   * An additional className to apply to the ButtonBase.
   */
  className: PropTypes.string,
  /**
   * Boolean to change button type to Danger when true
   */
  danger: PropTypes.bool,
  /**
   * Boolean to disable button
   */
  disabled: PropTypes.bool,
  /**
   * Add icon to left side of button text passing icon name
   * The name of the icon to display. Should be one of ICON_NAMES
   */
  icon: PropTypes.string, // Can't set PropTypes.oneOf(ICON_NAMES) because ICON_NAMES is an environment variable
  /**
   * Boolean that when true will position the icon on right of children
   * Icon default position left
   */
  iconPositionRight: PropTypes.bool,
  /**
   * iconProps accepts all the props from Icon
   */
  // iconProps: ButtonBase.Icon.propTypes,
  /**
   * Boolean to show loading spinner in button
   */
  loading: PropTypes.bool,
  /**
   * The possible size values for ButtonPrimary: 'BUTTON_SIZES.SM', 'BUTTON_SIZES.MD', 'BUTTON_SIZES.LG',
   * Default value is 'BUTTON_SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(BUTTON_SIZES)),
  /**
   * Addition style properties to apply to the button.
   */
  style: PropTypes.object,
  /**
   * ButtonPrimary accepts all the props from ButtonBase
   */
  ...ButtonBase.propTypes,
};

export default ButtonPrimary;
