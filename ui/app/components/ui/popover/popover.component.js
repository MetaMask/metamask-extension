import React from 'react'
import PropTypes from 'prop-types'
import PopoverHeader from './popover.header.component'

const Popover = ({ title, children, onClose }) => (
  <div className="popover-wrap">
    <div className="popover-content">
      <PopoverHeader title={title} onClose={onClose} />
      {children}
    </div>
    <a href="#" className="popover-bg" onClick={onClose} />
  </div>
)

Popover.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default Popover
