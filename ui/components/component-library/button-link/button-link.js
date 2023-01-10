import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonBase } from '../button-base';
import { COLORS } from '../../../helpers/constants/design-system';
import { BUTTON_LINK_SIZES } from './button-link.constants';

export const ButtonLink = ({
  className,
  danger,
  disabled,
  size = BUTTON_LINK_SIZES.MD,
  ...props
}) => {
  return (
    <ButtonBase
      className={classnames(className, 'mm-button-link', {
        'mm-button-link--type-danger': danger,
        'mm-button-link--disabled': disabled,
      })}
      size={size}
      color={danger ? COLORS.ERROR_DEFAULT : COLORS.PRIMARY_DEFAULT}
      backgroundColor={COLORS.TRANSPARENT}
      {...{ disabled, ...props }}
    />
  );
};

ButtonLink.propTypes = {
  /**
   * An additional className to apply to the ButtonLink.
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
   * Possible size values: 'SIZES.AUTO', 'SIZES.SM'(32px), 'SIZES.MD'(40px), 'SIZES.LG'(48px).
   * Default value is 'SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(BUTTON_LINK_SIZES)),
  /**
   * ButtonLink accepts all the props from ButtonBase
   */
  ...ButtonBase.propTypes,
};
