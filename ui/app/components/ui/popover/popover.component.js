import React from 'react'
import PropTypes from 'prop-types'
import PopOverheader from './popover.header.component'

const PopOver = ({ title, children, onClose }) => (
  <div className="popover-wrap">
    <div className="popover-content">
      <PopOverheader title={title} onClose={onClose} />
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
