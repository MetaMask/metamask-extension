import React from 'react'
import PropTypes from 'prop-types'

const PopOverheader = ({ title, onClose }) => (
  <div className="popover-header">
    <h2 className="popover-header__heading">{title}</h2>
    <a href="#" className="popover-header__close" onClick={onClose}>
      <div className="popover-header__close--wrap">
        <div className="popover-header__close--line-a"></div>
        <div className="popover-header__close--line-b"></div>
      </div>
    </a>
  </div>
)

PopOverheader.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default PopOverheader
