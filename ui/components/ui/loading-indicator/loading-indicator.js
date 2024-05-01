import React from 'react';
import PropTypes from 'prop-types';

export default function LoadingIndicator({
  alt,
  title,
  isLoading,
  children = null,
}) {
  return isLoading ? (
    <span className="loading-indicator">
      <img
        className="loading-indicator__spinner"
        alt={alt}
        title={title}
        src="images/loading.svg"
      />
    </span>
  ) : (
    children
  );
}

LoadingIndicator.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  alt: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};
