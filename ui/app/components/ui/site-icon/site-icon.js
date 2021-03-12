import React from 'react';
import PropTypes from 'prop-types';
import IconBorder from '../icon-border';
import IconWithFallback from '../icon-with-fallback';

export default function SiteIcon({ icon, name, size }) {
  const iconSize = Math.floor(size * 0.75);
  return (
    <IconBorder size={size}>
      <IconWithFallback icon={icon} name={name} size={iconSize} />
    </IconBorder>
  );
}

SiteIcon.propTypes = {
  icon: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.number.isRequired,
};

SiteIcon.defaultProps = {
  icon: undefined,
  name: undefined,
};
