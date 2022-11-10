import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  COLORS,
  FONT_WEIGHT,
  TEXT,
  DISPLAY,
  ALIGN_ITEMS,
} from '../../../helpers/constants/design-system';
import { Text } from '../text';

export const Label = ({
  htmlFor,
  required,
  disabled,
  className,
  children,
  ...props
}) => (
  <Text
    as="label"
    disabled={disabled}
    htmlFor={htmlFor}
    className={classnames(
      'mm-label',
      { 'mm-label--disabled': disabled },
      { 'mm-label--html-for': htmlFor && !disabled },
      className,
    )}
    variant={TEXT.BODY_MD}
    fontWeight={FONT_WEIGHT.BOLD}
    display={DISPLAY.INLINE_FLEX}
    alignItems={ALIGN_ITEMS.CENTER}
    {...props}
  >
    {children}
    {required && (
      <Text
        as="span"
        className="mm-label__required-asterisk"
        aria-hidden="true"
        color={COLORS.ERROR_DEFAULT}
      >
        *
      </Text>
    )}
  </Text>
);

Label.propTypes = {
  /**
   * The content of the label
   */
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * The id of the input associated with the label
   */
  htmlFor: PropTypes.string,
  /**
   * If true the label will display as required
   */
  required: PropTypes.bool,
  /**
   * Whether the label is disabled or not
   */
  disabled: PropTypes.bool,
  /**
   * Additional classNames to be added to the label component
   */
  className: PropTypes.string,
};
