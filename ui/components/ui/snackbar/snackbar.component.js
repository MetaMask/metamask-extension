import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const Snackbar = ({ className = '', content }) => (
  <div className={classnames('snackbar', className)}>{content}</div>
);

Snackbar.propTypes = {
  className: PropTypes.string,
  content: PropTypes.string.isRequired,
};

export default Snackbar;
