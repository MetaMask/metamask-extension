import PropTypes from 'prop-types'
import React from 'react'

export default function SvgIcon ({ children, className, onClick, svg }) {
  return (
    <i className={className} onClick={onClick}>
      { svg }
      { children }
    </i>
  )
}

SvgIcon.defaultProps = {
  children: null,
  className: null,
  onClick: null,
}

SvgIcon.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
  svg: PropTypes.node.isRequired,
}
