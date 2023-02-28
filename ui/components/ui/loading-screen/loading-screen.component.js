import React, { isValidElement } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../spinner';

const renderMessage = (message) => {
  if (!message) {
    return null;
  }
  return isValidElement(message) ? message : <span>{message}</span>;
};

const LoadingScreen = ({
  header,
  loadingMessage,
  showLoadingSpinner = true,
}) => {
  return (
    <div className="loading-overlay">
      {header}
      <div className="loading-overlay__container">
        {showLoadingSpinner && (
          <Spinner
            color="var(--color-warning-default)"
            className="loading-overlay__spinner"
          />
        )}
        {renderMessage(loadingMessage)}
      </div>
    </div>
  );
};

LoadingScreen.propTypes = {
  header: PropTypes.element,
  loadingMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  showLoadingSpinner: PropTypes.bool,
};

export default React.memo(LoadingScreen);
