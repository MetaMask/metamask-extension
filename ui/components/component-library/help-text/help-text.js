import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  COLORS,
  TEXT,
  SEVERITIES,
} from '../../../helpers/constants/design-system';

import { HELP_TEXT_SEVERITIES } from './help-text.constants';

import { Text } from '../text';

export const HelpText = ({ severity, className, children, ...props }) => {
  let severityColor = severity && `${severity.toUpperCase()}_DEFAULT`;
  /*
   * Currently our design token for danger is called error
   * this maps those tokens together
   * TODO: update when design tokens v2 is ready
   */
  if (severity === SEVERITIES.DANGER) {
    severityColor = COLORS.ERROR_DEFAULT.replace(/-/gu, '_').toUpperCase();
  }
  return (
    <Text
      as="span"
      className={classnames('mm-help-text', className)}
      variant={TEXT.BODY_XS}
      color={COLORS[severityColor]}
      {...props}
    >
      {children}
    </Text>
  );
};

HelpText.propTypes = {
  /**
   * The content of the help-text
   */
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * What severity the HelpText renders in. Can be one of
   * SEVERITIES.WARNING, SEVERITIES.DANGER, SEVERITIES.SUCCESS, SEVERITIES.INFO
   * Defaults to undefined and renders with color COLORS.TEXT_DEFAULT
   */
  severity: PropTypes.oneOf(Object.values(HELP_TEXT_SEVERITIES)),
  /**
   * Additional classNames to be added to the help-text component
   */
  className: PropTypes.string,
};
