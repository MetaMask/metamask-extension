import React from 'react'
import PropTypes from 'prop-types'

export default function IconBorder({ children, size }) {
  const borderStyle = { height: `${size}px`, width: `${size}px` }
  return (
    <div className="icon-border" style={borderStyle}>
      {children}
    </div>
  )
}

IconBorder.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.number.isRequired,
}
