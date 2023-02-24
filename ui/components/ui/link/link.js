import React from 'react';
import PropTypes from 'prop-types';

export const Link = ({ href, rel, target, referer, ...props }) => {
  const _rel = 'noopener'
    .concat(referer ? '' : ' noreferrer')
    .concat(rel ? ` ${rel}` : '')
    .split(' ');
  const _target = target || '_blank';

  const anchorProps = { ...props };
  if (_target) {
    anchorProps.target = _target;
  }
  return (
    <a rel={[...new Set(_rel)].join(' ')} {...anchorProps} href={href}>
      {props.children}
    </a>
  );
};

Link.propTypes = {
  referer: PropTypes.bool,
  children: PropTypes.node,
  // key: PropTypes.string,
  className: PropTypes.string,
  href: PropTypes.string,
  target: PropTypes.string,
  rel: PropTypes.string,
  onClick: PropTypes.func,
};

export default Link;
