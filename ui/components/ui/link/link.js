import React from 'react';
import PropTypes from 'prop-types';

const Link = ({ rel, ...props }) => {
  return (
    <a {...props} rel={`${rel} noopener`}>
      {props.children}
    </a>
  );
};

Link.propTypes = {
  children: PropTypes.node,
  key: PropTypes.string,
  className: PropTypes.string,
  href: PropTypes.string,
  target: PropTypes.string,
  rel: PropTypes.string,
  onClick: PropTypes.func,
};

export default Link;
