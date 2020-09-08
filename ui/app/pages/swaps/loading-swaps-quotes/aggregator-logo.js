import React from 'react'
import PropTypes from 'prop-types'

export default function AggregatorLogo ({ icon, color }) {
  return (
    <div className="loading-swaps-quotes__logo">
      <div style={{ background: color }}><img src={icon} /></div>
    </div>
  )
}

AggregatorLogo.propTypes = {
  icon: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
}
