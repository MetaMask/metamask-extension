import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const SECONDARY = 'secondary'
const CLASSNAME_PRIMARY = 'btn-primary'
const CLASSNAME_PRIMARY_LARGE = 'btn-primary--lg'
const CLASSNAME_SECONDARY = 'btn-secondary'
const CLASSNAME_SECONDARY_LARGE = 'btn-secondary--lg'

const getClassName = (type, large = false) => {
  let output = type === SECONDARY ? CLASSNAME_SECONDARY : CLASSNAME_PRIMARY

  if (large) {
    output += ` ${type === SECONDARY ? CLASSNAME_SECONDARY_LARGE : CLASSNAME_PRIMARY_LARGE}`
  }

  return output
}

class Button extends Component {
  render () {
    const { type, large, className, ...buttonProps } = this.props

    return (
      <button
        className={classnames(getClassName(type, large), className)}
        { ...buttonProps }
      >
        { this.props.children }
      </button>
    )
  }
}

Button.propTypes = {
  type: PropTypes.string,
  large: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.string,
}

export default Button

