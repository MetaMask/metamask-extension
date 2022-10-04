import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonBase } from '../button-base';
import { BUTTON_SIZES } from './button-primary.constants';

export const ButtonPrimary = ({ className, children, danger, ...props }) => {
  return (
    <ButtonBase
      className={classnames(className, 'mm-button-primary', {
        'mm-button-primary--type-danger': Boolean(danger),
      })}
      {...props}
    >
      {children}
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
   * An additional className to apply to the button
   */
  className: PropTypes.string,
  /**
   * The children to be rendered inside the ButtonPrimary
   */
  children: PropTypes.node,
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
