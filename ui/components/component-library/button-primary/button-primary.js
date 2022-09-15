import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  BUTTON_SIZES,
  BUTTON_TYPES,
} from '../../../helpers/constants/design-system';

import { ButtonBase } from '../button-base';

export const ButtonPrimary = ({
  type = BUTTON_TYPES.NORMAL,
  className,
  children,
  leftIcon,
  rightIcon,
  ...props
}) => {
  return (
    <ButtonBase
      className={classnames(
        className,
        'mm-button-primary',
        `mm-button-primary--${type}`,
      )}
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
   * The size of the ButtonPrimary.
   * Possible values could be 'BUTTON_SIZES.SM', 'BUTTON_SIZES.MD', 'BUTTON_SIZES.LG',
   * Default value is 'BUTTON_SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(BUTTON_SIZES)),
  /**
   * Possible values could be 'BUTTON_TYPES.NORMAL', 'BUTTON_TYPES.DANGER'
   * Default value is 'BUTTON_TYPES.NORMAL'.
   */
  type: PropTypes.oneOf(Object.values(BUTTON_TYPES)),
  /**
   * An additional className to apply to the button
   */
  className: PropTypes.string,
  /**
   * The children to be rendered inside the ButtonPrimary
   */
  children: PropTypes.node,
  /**
   * Add icon to left side of button text
   */
  leftIcon: PropTypes.node,
  /**
   * Add icon to right side of button text
   */
  rightIcon: PropTypes.node,
  /**
   * ButtonPrimary accepts all the props from ButtonBase
   */
  ...ButtonBase.propTypes,
};

export default ButtonPrimary;
