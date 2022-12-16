import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonBase } from '../button-base';
import { COLORS } from '../../../helpers/constants/design-system';
import { BUTTON_LINK_SIZES } from './button-link.constants';

export const ButtonLink = ({
  className,
  danger,
  size = BUTTON_LINK_SIZES.MD,
  noPadding,
  ...props
}) => {
  return (
    <ButtonBase
      className={classnames(className, 'mm-button-link', {
        'mm-button-link--type-danger': danger,
        'mm-button-link--no-padding': noPadding,
      })}
      paddingLeft={noPadding || size === BUTTON_LINK_SIZES.INHERIT ? 0 : 4}
      paddingRight={noPadding || size === BUTTON_LINK_SIZES.INHERIT ? 0 : 4}
      size={size}
      backgroundColor={COLORS.TRANSPARENT}
      {...props}
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
   * Boolean to remove padding
   */
  noPadding: PropTypes.bool,
  /**
   * Possible size values: 'SIZES.INHERIT', 'SIZES.SM'(32px), 'SIZES.MD'(40px), 'SIZES.LG'(48px).
   * Default value is 'SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(BUTTON_LINK_SIZES)),
  /**
   * ButtonLink accepts all the props from ButtonBase
   */
  ...ButtonBase.propTypes,
};
