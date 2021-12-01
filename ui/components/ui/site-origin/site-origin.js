import React from 'react';
import PropTypes from 'prop-types';
import Chip from '../chip';
import IconWithFallback from '../icon-with-fallback';

export default function SiteOrigin({ siteOrigin, iconSrc, iconName }) {
  return (
    <div className="site-origin">
      <Chip
        label={siteOrigin}
        maxContent={false}
        leftIcon={<IconWithFallback icon={iconSrc} name={iconName} size={32} />}
      />
    </div>
  );
}

SiteOrigin.propTypes = {
  siteOrigin: PropTypes.string.isRequired,
  iconName: PropTypes.string,
  iconSrc: PropTypes.string,
};
