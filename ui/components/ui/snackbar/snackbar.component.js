import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

const Snackbar = ({ className = '', content }) => {
  return <div className={classnames('snackbar', className)}>{content}</div>;
};

Snackbar.propTypes = {
  className: PropTypes.string,
  content: PropTypes.string.isRequired,
};

export default Snackbar;
