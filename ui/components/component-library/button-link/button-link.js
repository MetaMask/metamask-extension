import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonBase } from '../button-base';
import {
  BORDER_STYLE,
  COLORS,
  SIZES,
  TEXT,
} from '../../../helpers/constants/design-system';
import { BUTTON_LINK_SIZES } from './button-link.constants';

export const ButtonLink = ({
  className,
  danger,
  disabled,
  size = SIZES.MD,
  as = 'button',
  href,
  ...props
}) => {
  const Tag = href ? 'a' : as;
  return (
    <ButtonBase
      className={classnames(className, 'mm-button-link', {
        'mm-button-link--type-danger': danger,
        'mm-button-link--disabled': disabled,
        'mm-button-link--size-auto': size === SIZES.AUTO,
      })}
      as={Tag}
      href={href}
      size={size === SIZES.AUTO ? null : size}
      paddingLeft={size === SIZES.AUTO ? 0 : 4} // TODO will work once 0 value Box is fixed
      paddingRight={size === SIZES.AUTO ? 0 : 4} // TODO will work once 0 value Box is fixed
      color={danger ? COLORS.ERROR_DEFAULT : COLORS.PRIMARY_DEFAULT}
      borderStyle={BORDER_STYLE.NONE}
      backgroundColor={COLORS.TRANSPARENT}
      buttonTextProps={{
        variant: size === SIZES.AUTO ? TEXT.INHERIT : TEXT.BODY_MD,
      }}
      {...{ disabled, ...props }}
    />
  );
};

ButtonLink.propTypes = {
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   */
  as: PropTypes.string,
  /**
   * When an `href` prop is passed, ButtonLink will automatically change the root element to be an `a` (anchor) tag
   */
  href: PropTypes.string,
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
   * ButtonLink accepts all the props from ButtonBase
   */
  ...ButtonBase.propTypes,
  /**
   * Possible size values: 'SIZES.AUTO', 'SIZES.SM'(32px), 'SIZES.MD'(40px), 'SIZES.LG'(48px).
   * Extends ButtonBase sizes with 'SIZES.AUTO' value
   * Default value is 'SIZES.MD'.
   */
  size: PropTypes.oneOf(Object.values(BUTTON_LINK_SIZES)),
};
