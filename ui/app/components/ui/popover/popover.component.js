import React from 'react'
import PropTypes from 'prop-types'

const PopOver = ({ title, children, onClose }) => (
  <div>
    <div className="popover-content">
      <div className="header">
        <h2>{title}</h2>
        <a href="#" className="close" onClick={onClose}>
          <div>
            <div className="line a"></div>
            <div className="line b"></div>
          </div>
        </a>
      </div>
      <div className="container">
        {children}
      </div>
    </div>
    <a href="#" className="popover-bg" onClick={onClose} />
  </div>
)

PopOver.propTypes = {
  title: PropTypes.string,
  children: PropTypes.children,
  onClose: PropTypes.func,
}

export default PopOver
