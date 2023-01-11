import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  COLORS,
  TEXT,
  TEXT_COLORS,
} from '../../../helpers/constants/design-system';

import { Text } from '../text';

export const HelpText = ({
  error,
  color = COLORS.TEXT_DEFAULT,
  className,
  children,
  ...props
}) => (
  <Text
    className={classnames('mm-help-text', className)}
    as="span"
    variant={TEXT.BODY_XS}
    color={error ? COLORS.ERROR_DEFAULT : color}
    {...props}
  >
    {children}
  </Text>
);

HelpText.propTypes = {
  /**
   * If the HelperText should display in error state
   * Will override the color prop if true
   */
  error: PropTypes.bool,
  /**
   * The color of the HelpText will be overridden if error is true
   * Defaults to COLORS.TEXT_DEFAULT
   */
  color: PropTypes.oneOf(Object.values(TEXT_COLORS)),
  /**
   * The content of the help-text
   */
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Additional classNames to be added to the HelpText component
   */
  className: PropTypes.string,
  /**
   * HelpText also accepts all Text and Box props
   */
  ...Text.propTypes,
};
