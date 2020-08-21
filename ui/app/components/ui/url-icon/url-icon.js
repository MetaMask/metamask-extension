import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default function UrlIcon ({
  url,
  className,
}) {
  return (
    <div
      className={classnames('url-icon', className)}
      style={{ backgroundImage: `url(${url})` }}
    />
  )
}

UrlIcon.propTypes = {
  url: PropTypes.string,
  className: PropTypes.string,
}
