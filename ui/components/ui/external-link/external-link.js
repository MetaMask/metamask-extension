import React from 'react';
import PropTypes from 'prop-types';
import Link from '../link';

export const ExternalLink = ({ target, ...props }) => {
  const _target = target || '_blank';
  const anchorProps = { ...props };
  if (_target) {
    anchorProps.target = _target;
  }
  return <Link {...anchorProps}>{props.children}</Link>;
};

ExternalLink.propTypes = {
  referer: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  href: PropTypes.string,
  target: PropTypes.string,
  rel: PropTypes.string,
  onClick: PropTypes.func,
};

export default ExternalLink;
