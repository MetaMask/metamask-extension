import PropTypes from 'prop-types'
import React from 'react'
import ReactTooltip from 'react-tooltip-component'

function Tooltip ({ position, title, children }) {
  return (
    <ReactTooltip position={position} title={title} fixed>
      {children}
    </ReactTooltip>
  )
}

Tooltip.defaultProps = {
  position: 'left',
  children: null,
}

Tooltip.propTypes = {
  position: PropTypes.string,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
}

module.exports = Tooltip
