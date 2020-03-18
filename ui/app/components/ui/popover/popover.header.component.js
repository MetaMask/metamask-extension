import React from 'react'
import PropTypes from 'prop-types'

const PopoverHeader = ({ title, onClose }) => (
  <header className="popover-header">
    <h2 className="popover-header__heading">{title}</h2>
    <button className="popover-header__close" onClick={onClose}>
      <div className="popover-header__close-wrap">
        <div className="popover-header__close-line-a"></div>
        <div className="popover-header__close-line-b"></div>
      </div>
    </button>
  </header>
)

PopoverHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default PopoverHeader
