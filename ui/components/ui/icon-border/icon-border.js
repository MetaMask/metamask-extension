import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default function IconBorder({ children, size, className }) {
  const borderStyle = { height: `${size}px`, width: `${size}px` };
  return (
    <div className={classnames('icon-border', className)} style={borderStyle}>
      {children}
    </div>
  );
}

IconBorder.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.number.isRequired,
};
