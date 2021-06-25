import React from 'react';
import PropTypes from 'prop-types';

const DetailedErrorMessage = (props) => {
  const { errorMessage, onErrorMessageClick, linkText } = props;

  return (
    <div className="error-message">
      <img
        src="./images/alert-red.svg"
        alt=""
        className="error-message__icon"
      />
      <div className="error-message__text">
        {errorMessage}
        <a className="error-message__link" onClick={onErrorMessageClick}>
          {` ${linkText}`}
        </a>
      </div>
    </div>
  );
};

DetailedErrorMessage.propTypes = {
  errorMessage: PropTypes.string.isRequired,
  linkText: PropTypes.string.isRequired,
  onErrorMessageClick: PropTypes.func.isRequired,
};

DetailedErrorMessage.contextTypes = {
  t: PropTypes.func,
};

export default DetailedErrorMessage;
