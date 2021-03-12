import React, { Component, isValidElement } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../spinner';

class LoadingScreen extends Component {
  static defaultProps = {
    loadingMessage: null,
    showLoadingSpinner: true,
  };

  static propTypes = {
    loadingMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    showLoadingSpinner: PropTypes.bool,
    header: PropTypes.element,
  };

  renderMessage() {
    const { loadingMessage } = this.props;

    if (!loadingMessage) {
      return null;
    }

    return isValidElement(loadingMessage) ? (
      loadingMessage
    ) : (
      <span>{loadingMessage}</span>
    );
  }

  render() {
    return (
      <div className="loading-overlay">
        {this.props.header}
        <div className="loading-overlay__container">
          {this.props.showLoadingSpinner && (
            <Spinner color="#F7C06C" className="loading-overlay__spinner" />
          )}
          {this.renderMessage()}
        </div>
      </div>
    );
  }
}

export default LoadingScreen;
