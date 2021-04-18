import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

export default function IconWithLabel({ icon, label, className }) {
  return (
    <div className={classnames('icon-with-label', className)}>
      {icon}
      {label && <span className="icon-with-label__label">{label}</span>}
    </div>
  );
}

IconWithLabel.propTypes = {
  icon: PropTypes.node.isRequired,
  className: PropTypes.string,
  label: PropTypes.string,
};
