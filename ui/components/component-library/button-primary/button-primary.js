import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { PRIMARY_SECONDARY_BUTTON_SIZES } from '../../../helpers/constants/design-system';

import { ButtonBase } from '../button-base';

export const ButtonPrimary = ({
  className,
  children,
  leftIcon,
  rightIcon,
  isDanger,
  isDisabled,
  ...props
}) => {
  return (
    <ButtonBase
      className={classnames(className, 'mm-button-primary', {
        [`mm-button-primary--danger`]: Boolean(isDanger),
        [`mm-button-primary--disabled`]: Boolean(isDisabled),
      })}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </ButtonBase>
  );
};

ButtonPrimary.propTypes = {
  /**
   * The size of the ButtonBase.
   * Possible values could be 'BUTTON_SIZES.SM', 'BUTTON_SIZES.MD', 'BUTTON_SIZES.LG', 'BUTTON_SIZES.XL',
   * Default value is 'BUTTON_SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(PRIMARY_SECONDARY_BUTTON_SIZES)),
  /**
   * An additional className to apply to the button
   */
  className: PropTypes.string,
  /**
   * The children to be rendered inside the ButtonPrimary
   */
  children: PropTypes.node,
  /**
   * Boolean to change button color to danger(red)
   */
  isDanger: PropTypes.bool,
  /**
   * Add icon to left side of button text
   */
  leftIcon: PropTypes.node,
  /**
   * Add icon to right side of button text
   */
  right: PropTypes.node,
  /**
   * Boolean to disable button
   */
  isDisabled: PropTypes.bool,
  /**
   * ButtonPrimary accepts all the props from ButtonBase
   */
  ...ButtonBase.propTypes,
};

export default ButtonPrimary;
