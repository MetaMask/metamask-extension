import React from 'react';
import PropTypes from 'prop-types';
import IconBorder from '../icon-border';
import IconWithFallback from '../icon-with-fallback';
import Privacy from '../privacy';

export default function SiteIcon({ icon = null, name = '', size, className }) {
  const iconSize = Math.floor(size * 0.75);
  return (
    <Privacy>
      <IconBorder size={size} className={className}>
        <IconWithFallback icon={icon} name={name} size={iconSize} />
      </IconBorder>
    </Privacy>
  );
}

SiteIcon.propTypes = {
  /**
   * Additional className to add to the root element of SiteIcon.
   */
  className: PropTypes.string,
  /**
   * The img src of the icon.
   * Used in IconWithFallback
   */
  icon: PropTypes.string,
  /**
   * The name of the icon also used for the alt tag of the image and fallback letter.
   * Used in IconWithFallback
   */
  name: PropTypes.string,
  /**
   * The size of the icon.
   * Used in IconWithFallback
   */
  size: PropTypes.number.isRequired,
};
