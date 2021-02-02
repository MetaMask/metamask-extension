import PropTypes from 'prop-types'
import React from 'react'

export default function NetworkTag(props) {
  const { wrapperClass = '', name } = props

  return <div className={`network-tag ${wrapperClass}`}>{name}</div>
}

NetworkTag.propTypes = {
  wrapperClass: PropTypes.string,
  name: PropTypes.string,
}
