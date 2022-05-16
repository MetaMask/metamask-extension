import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Chip from '../chip';
import IconWithFallback from '../icon-with-fallback';

export default function SiteOrigin({
  siteOrigin,
  iconSrc,
  iconName,
  chip,
  className,
  title,
}) {
  return (
    <div className={classnames('site-origin', className)} title={title}>
      {chip ? (
        <Chip
          label={siteOrigin}
          maxContent={false}
          leftIcon={
            <IconWithFallback
              icon={iconSrc}
              name={iconName}
              size={32}
              className={className}
            />
          }
        />
      ) : (
        <span>{siteOrigin}</span>
      )}
    </div>
  );
}

SiteOrigin.propTypes = {
  siteOrigin: PropTypes.string.isRequired,
  iconName: PropTypes.string,
  iconSrc: PropTypes.string,
  className: PropTypes.string,
  title: PropTypes.string,
  chip: PropTypes.bool,
};
