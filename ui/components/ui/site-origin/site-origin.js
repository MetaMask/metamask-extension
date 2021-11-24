import React from 'react';
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
