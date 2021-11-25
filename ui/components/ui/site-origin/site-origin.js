import React from 'react';
import PropTypes from 'prop-types';
import Chip from '../chip';
import IconWithFallback from '../icon-with-fallback';

export default function SiteOrigin({ siteOrigin, iconSrc, iconName }) {
  return (
    <Chip
      label={siteOrigin}
      leftIcon={<IconWithFallback icon={iconSrc} name={iconName} size={32} />}
    />
  );
}

SiteOrigin.propTypes = {
  siteOrigin: PropTypes.string.isRequired,
  iconName: PropTypes.string.isRequired,
  iconSrc: PropTypes.string.isRequired,
};
