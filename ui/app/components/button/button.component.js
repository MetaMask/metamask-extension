import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const CLASSNAME_DEFAULT = 'btn-default'
const CLASSNAME_PRIMARY = 'btn-primary'
const CLASSNAME_SECONDARY = 'btn-secondary'
const CLASSNAME_CONFIRM = 'btn-confirm'
const CLASSNAME_RAISED = 'btn-raised'
const CLASSNAME_LARGE = 'btn--large'

const typeHash = {
  default: CLASSNAME_DEFAULT,
  primary: CLASSNAME_PRIMARY,
  secondary: CLASSNAME_SECONDARY,
  confirm: CLASSNAME_CONFIRM,
  raised: CLASSNAME_RAISED,
}

export default class Button extends Component {
  static defaultProps = {
    buttonRef: () => {},
  }

  static propTypes = {
    buttonRef: PropTypes.func,
    type: PropTypes.string,
    large: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  }

  render () {
    const { buttonRef, type, large, className, ...buttonProps } = this.props

    return (
      <button
        ref={buttonRef}
        className={classnames(
          'button',
          typeHash[type],
          large && CLASSNAME_LARGE,
          className
        )}
        { ...buttonProps }
      >
        { this.props.children }
      </button>
    )
  }
}
