import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonBase } from '../button-base';
import { BUTTON_SIZES } from './button-primary.constants';

export const ButtonPrimary = ({ danger, ...props }) => {
  return (
    <ButtonBase
      className={classnames('mm-button-primary', {
        'mm-button-primary--type-danger': danger,
      })}
      {...props}
    />
  );
};

ButtonPrimary.propTypes = {
  /**
   * The possible size values for ButtonPrimary: 'BUTTON_SIZES.SM', 'BUTTON_SIZES.MD', 'BUTTON_SIZES.LG',
   * Default value is 'BUTTON_SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(BUTTON_SIZES)),
  /**
   * Boolean to change button type to Danger when true
   */
  danger: PropTypes.bool,
  /**
   * ButtonPrimary accepts all the props from ButtonBase
   */
  ...ButtonBase.propTypes,
};

export default ButtonPrimary;
