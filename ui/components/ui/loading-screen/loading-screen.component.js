import React, { isValidElement } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../spinner';

const LoadingScreen = ({
  header,
  loadingMessage,
  showLoadingSpinner = true,
}) => {
  const renderMessage = () => {
    if (!loadingMessage) {
      return null;
    }

    return isValidElement(loadingMessage) ? (
      loadingMessage
    ) : (
      <span>{loadingMessage}</span>
    );
  };

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
        {renderMessage()}
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
