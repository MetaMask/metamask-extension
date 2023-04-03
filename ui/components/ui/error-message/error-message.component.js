import React from 'react';
import PropTypes from 'prop-types';
import { Icon, ICON_NAMES } from '../../component-library';
import { IconColor, Size } from '../../../helpers/constants/design-system';

/**
 * @deprecated - Please use ActionableMessage type danger
 * @see ActionableMessage
 * @param {object} props
 * @param {string} props.errorMessage
 * @param {string} props.errorKey
 * @param {object} context
 */
const ErrorMessage = (props, context) => {
  const { errorMessage, errorKey } = props;
  const error = errorKey ? context.t(errorKey) : errorMessage;

  return (
    <div className="error-message">
      <Icon
        className="error-message__icon"
        name={ICON_NAMES.WARNING}
        size={Size.SM}
        color={IconColor.errorDefault}
        marginRight={2}
      />
      <div className="error-message__text">{error}</div>
    </div>
  );
};

ErrorMessage.propTypes = {
  /**
   * The text content for the error message
   */
  errorMessage: PropTypes.string,
  /**
   * The translate key for localization. Uses context.t(). Will override the error message
   */
  errorKey: PropTypes.string,
};

ErrorMessage.contextTypes = {
  t: PropTypes.func,
};

export default ErrorMessage;
