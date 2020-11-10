import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import IconWithFallback from '../icon-with-fallback'

export default function UrlIcon({ url, className, name }) {
  return (
    <IconWithFallback
      className={classnames('url-icon', className)}
      icon={url}
      name={name}
      fallbackClassName="url-icon__fallback"
    />
  )
}

UrlIcon.propTypes = {
  url: PropTypes.string,
  className: PropTypes.string,
  name: PropTypes.string,
}
