import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonBase } from '../button-base';
import { BUTTON_PRIMARY_SIZES } from './button-primary.constants';

export const ButtonPrimary = ({
  className,
  danger,
  size = BUTTON_PRIMARY_SIZES.MD,

  ...props
}) => {
  return (
    <ButtonBase
      className={classnames(className, 'mm-button-primary', {
        'mm-button-primary--type-danger': danger,
      })}
      size={size}
      {...props}
    />
  );
};

ButtonPrimary.propTypes = {
  /**
   * An additional className to apply to the ButtonPrimary.
   */
  className: PropTypes.string,
  /**
   * Boolean to change button type to Danger when true
   */
  danger: PropTypes.bool,
  /**
   * The possible size values for ButtonPrimary: 'BUTTON_PRIMARY_SIZES.SM', 'BUTTON_PRIMARY_SIZES.MD', 'BUTTON_PRIMARY_SIZES.LG',
   * Default value is 'BUTTON_PRIMARY_SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(BUTTON_PRIMARY_SIZES)),
  /**
   * ButtonPrimary accepts all the props from ButtonBase
   */
  ...ButtonBase.propTypes,
};

export default ButtonPrimary;
