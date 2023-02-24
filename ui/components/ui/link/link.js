import React from 'react';
import PropTypes from 'prop-types';

export const Link = ({ href, rel, referer, ...props }) => {
  const _rel = 'noopener'
    .concat(referer ? '' : ' noreferrer')
    .concat(rel ? ` ${rel}` : '')
    .split(' ');

  return (
    <a rel={[...new Set(_rel)].join(' ')} {...props} href={href}>
      {props.children}
    </a>
  );
};

Link.propTypes = {
  referer: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  href: PropTypes.string,
  target: PropTypes.string,
  rel: PropTypes.string,
  onClick: PropTypes.func,
};
export default Link;
