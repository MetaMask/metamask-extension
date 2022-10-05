import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonBase } from '../button-base';
import { BUTTON_SECONDARY_SIZES } from './button-secondary.constants';

export const ButtonSecondary = ({
  className,
  danger,
  size = BUTTON_SECONDARY_SIZES.MD,

  ...props
}) => {
  return (
    <ButtonBase
      className={classnames(className, 'mm-button-secondary', {
        'mm-button-secondary--type-danger': danger,
      })}
      size={size}
      {...props}
    />
  );
};

ButtonSecondary.propTypes = {
  /**
   * An additional className to apply to the ButtonSecondary.
   */
  className: PropTypes.string,
  /**
   * Boolean to change button type to Danger when true
   */
  danger: PropTypes.bool,
  /**
   * The possible size values for ButtonSecondary: 'BUTTON_SECONDARY_SIZES.SM', 'BUTTON_SECONDARY_SIZES.MD', 'BUTTON_SECONDARY_SIZES.LG',
   * Default value is 'BUTTON_SECONDARY_SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(BUTTON_SECONDARY_SIZES)),
  /**
   * ButtonSecondary accepts all the props from ButtonBase
   */
  ...ButtonBase.propTypes,
};

export default ButtonSecondary;
