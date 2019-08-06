import React from 'react'
import PropTypes from 'prop-types'
import ReactToggleButton from 'react-toggle-button'

const trackStyle = {
  width: '40px',
  height: '24px',
  padding: '0px',
  borderRadius: '26px',
  border: '2px solid rgb(3, 125, 214)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const offTrackStyle = {
  ...trackStyle,
  border: '2px solid #8E8E8E',
}

const thumbStyle = {
  width: '18px',
  height: '18px',
  display: 'flex',
  boxShadow: 'none',
  alignSelf: 'center',
  borderRadius: '50%',
  position: 'relative',
}

const colors = {
  activeThumb: {
    base: '#037DD6',
  },
  inactiveThumb: {
    base: '#037DD6',
  },
  active: {
    base: '#ffffff',
    hover: '#ffffff',
  },
  inactive: {
    base: '#DADADA',
    hover: '#DADADA',
  },
}

const ToggleButton = props => {
  const { value, onToggle, offLabel, onLabel } = props

  return (
    <div className="toggle-button">
      <ReactToggleButton
        value={value}
        onToggle={onToggle}
        activeLabel=""
        inactiveLabel=""
        trackStyle={value ? trackStyle : offTrackStyle}
        thumbStyle={thumbStyle}
        thumbAnimateRange={[3, 18]}
        colors={colors}
      />
      <div className="toggle-button__status-label">{ value ? onLabel : offLabel }</div>
    </div>
  )
}

ToggleButton.propTypes = {
  value: PropTypes.bool,
  onToggle: PropTypes.func,
  offLabel: PropTypes.string,
  onLabel: PropTypes.string,
}

export default ToggleButton
