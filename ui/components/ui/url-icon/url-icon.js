import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import IconWithFallback from '../icon-with-fallback';

export default function UrlIcon({ url, className, name, fallbackClassName }) {
  return (
    <IconWithFallback
      className={classnames('url-icon', className)}
      icon={url}
      name={name}
      fallbackClassName={classnames('url-icon__fallback', fallbackClassName)}
    />
  );
}

UrlIcon.propTypes = {
  url: PropTypes.string,
  className: PropTypes.string,
  name: PropTypes.string,
  fallbackClassName: PropTypes.string,
};
