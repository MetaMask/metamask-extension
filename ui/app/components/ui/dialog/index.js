import React from 'react'
import PropTypes from 'prop-types'
import c from 'classnames'

export default function Dialog (props) {
  const { children, type, className, onClick } = props
  return (
    <div
      className={c('dialog', className, {
        'dialog--message': type === 'message',
        'dialog--error': type === 'error',
        'dialog--warning': type === 'warning',
      })}
      onClick={onClick}
    >
      { children }
    </div>
  )
}

Dialog.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  type: PropTypes.oneOf(['message', 'error', 'warning']),
  onClick: PropTypes.func,
}
