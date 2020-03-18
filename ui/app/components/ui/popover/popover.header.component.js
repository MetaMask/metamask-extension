import React from 'react'
import PropTypes from 'prop-types'
import Close from '../icon/close-icon.component'

const PopoverHeader = ({ title, onClose }) => (
  <header className="popover-header">
    <h2 className="popover-header__heading">{title}</h2>
    <Close
      onClick={onClose}
      className="popover-header__close"
      size={18}
      color="#4A4A4A"
    />
  </header>
)

PopoverHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default PopoverHeader
