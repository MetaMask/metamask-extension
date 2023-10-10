import React, { useState } from 'react'
import PropTypes from 'prop-types'

export default function CaretToggleDropdown ({
  text = '',
  children = null,
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="caret-toggle-dropdown">
      <div
        onClick={() => setOpen(!open)}
        className="caret-toggle-dropdown__text-caret-wrap"
      >
        <div className="caret-toggle-dropdown__text">{ text }</div>
        {open ? <i className="fa fa-angle-up" /> : <i className="fa fa-angle-down" />}
      </div>
      {open && (
        <div className="caret-toggle-dropdown__content">
          { children }
        </div>
      )}
    </div>
  )
}

CaretToggleDropdown.propTypes = {
  text: PropTypes.string,
  children: PropTypes.node,
}
