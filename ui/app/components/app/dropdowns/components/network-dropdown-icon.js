import PropTypes from 'prop-types'
import React from 'react'

function NetworkDropdownIcon(props) {
  const { backgroundColor, isSelected, innerBorder, diameter, loading } = props

  return loading ? (
    <span
      className="pointer network-indicator"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
      }}
    >
      <img alt="" style={{ width: '27px' }} src="images/loading.svg" />
    </span>
  ) : (
    <div className={`menu-icon-circle${isSelected ? '--active' : ''}`}>
      <div
        style={{
          background: backgroundColor,
          border: innerBorder,
          height: `${diameter}px`,
          width: `${diameter}px`,
        }}
      />
    </div>
  )
}

NetworkDropdownIcon.defaultProps = {
  backgroundColor: undefined,
  loading: false,
  innerBorder: 'none',
  diameter: '12',
  isSelected: false,
}

NetworkDropdownIcon.propTypes = {
  backgroundColor: PropTypes.string,
  loading: PropTypes.bool,
  innerBorder: PropTypes.string,
  diameter: PropTypes.string,
  isSelected: PropTypes.bool,
}

export default NetworkDropdownIcon
