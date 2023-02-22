import React from 'react';
import PropTypes from 'prop-types';

const Link = ({ href, rel, target, referer, ...props }) => {
  const _rel = 'noopener'
    .concat(rel ? ` ${rel}` : '')
    .concat(href && href.startsWith('http') && !referer ? ' noreferrer' : '')
    .split(' ');
  const _target = target || (href && href.startsWith('http') ? '_blank' : null);

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
  key: PropTypes.string,
  className: PropTypes.string,
  href: PropTypes.string,
  target: PropTypes.string,
  rel: PropTypes.string,
  onClick: PropTypes.func,
};

export default Link;
