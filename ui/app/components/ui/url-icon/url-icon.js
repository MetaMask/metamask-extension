import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default function UrlIcon ({
  url,
  className,
}) {
  return (
    <img className={classnames('url-icon', className)} src={url} />
  )
}

UrlIcon.propTypes = {
  url: PropTypes.string,
  className: PropTypes.string,
}
