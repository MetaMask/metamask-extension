import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Text } from '../text';
import {
  FONT_WEIGHT,
  TextVariant,
  DISPLAY,
  AlignItems,
} from '../../../helpers/constants/design-system';

export const Label = ({ htmlFor, className, children, ...props }) => (
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
   * Additional classNames to be added to the label component
   */
  className: PropTypes.string,
};
