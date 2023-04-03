import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Text } from '../text';
import {
  Color,
  FONT_WEIGHT,
  TextVariant,
  DISPLAY,
  AlignItems,
} from '../../../helpers/constants/design-system';

export const Label = ({ htmlFor, required, className, children, ...props }) => (
  <Text
    className={classnames(
      'mm-label',
      { 'mm-label--html-for': htmlFor },
      className,
    )}
    as="label"
    htmlFor={htmlFor}
    variant={TextVariant.bodyMd}
    fontWeight={FONT_WEIGHT.BOLD}
    display={DISPLAY.INLINE_FLEX}
    alignItems={AlignItems.center}
    {...props}
  >
    {children}
    {required && (
      <Text
        as="span"
        className="mm-label__required-asterisk"
        aria-hidden="true"
        color={Color.errorDefault}
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
   * Additional classNames to be added to the label component
   */
  className: PropTypes.string,
};
