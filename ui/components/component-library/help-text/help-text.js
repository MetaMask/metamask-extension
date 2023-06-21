import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  Color,
  TextVariant,
  TextColor,
  SEVERITIES,
} from '../../../helpers/constants/design-system';

import { Text } from '../text';

export const HelpText = ({
  severity,
  color = Color.textDefault,
  className,
  children,
  ...props
}) => {
  const severityColor = () => {
    switch (severity) {
      case SEVERITIES.DANGER:
        return TextColor.errorDefault;
      case SEVERITIES.WARNING:
        return TextColor.warningDefault;
      case SEVERITIES.SUCCESS:
        return TextColor.successDefault;
      case SEVERITIES.INFO:
        return TextColor.infoDefault;
      // Defaults to SEVERITIES.INFO
      default:
        return TextColor.textDefault;
    }
  };
  return (
    <Text
      className={classnames('mm-help-text', className)}
      as={children && typeof children === 'object' ? 'div' : 'p'}
      variant={TextVariant.bodyXs}
      color={severity ? severityColor() : color}
      {...props}
    >
      {children}
    </Text>
  );
};
HelpText.propTypes = {
  /**
   * The color of the HelpText will be overridden if there is a severity passed
   * Defaults to Color.textDefault
   */
  color: PropTypes.oneOf(Object.values(TextColor)),
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
