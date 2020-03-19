import React from 'react'
import PropTypes from 'prop-types'
import PopoverHeader from './popover.header.component'

const Popover = ({ title, children, onClose }) => (
  <div className="popover-container">
    <div className="popover-bg" onClick={onClose} />
    <div className="popover-wrap">
      <PopoverHeader title={title} onClose={onClose} />
      <div className="popover-content">
        {children}
      </div>
    </div>
  </div>
)

Popover.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default Popover
