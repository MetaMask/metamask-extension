import React from 'react'
import PropTypes from 'prop-types'

const PopOver = ({ title, children, onClose }) => (
  <div className="popover-wrap">
    <div className="popover-content">
      <div className="popover-header">
        <h2 className="popover-header__heading">{title}</h2>
        <a href="#" className="popover-header__close" onClick={onClose}>
          <div className="popover-header__close--wrap">
            <div className="popover-header__close--line-a"></div>
            <div className="popover-header__close--line-b"></div>
          </div>
        </a>
      </div>
      {children}
    </div>
    <a href="#" className="popover-bg" onClick={onClose} />
  </div>
)

PopOver.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  onClose: PropTypes.func.isRequired,
}

export default PopOver
