import React from 'react';
import PropTypes from 'prop-types';

const ErrorMessage = (props, context) => {
  const { errorMessage, errorKey } = props;
  const error = errorKey ? context.t(errorKey) : errorMessage;

  return (
    <div className="error-message">
      <img
        src="./images/alert-red.svg"
        alt=""
        className="error-message__icon"
      />
      <div className="error-message__text">{error}</div>
    </div>
  );
};

ErrorMessage.propTypes = {
  /**
   * Show error message content
   */
  errorMessage: PropTypes.string,
  /**
   * Show error message content with translate key
   */
  errorKey: PropTypes.string,
};

ErrorMessage.contextTypes = {
  t: PropTypes.func,
};

export default ErrorMessage;
