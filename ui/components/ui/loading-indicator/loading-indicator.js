import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '../../component-library';

export default function LoadingIndicator({
  alt,
  title,
  isLoading,
  children = null,
  ...props
}) {
  return isLoading ? (
    <Box className="loading-indicator" {...props}>
      <img
        className="loading-indicator__spinner"
        alt={alt}
        title={title}
        src="images/loading.svg"
      />
    </Box>
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
