import PropTypes from 'prop-types'
import React from 'react'
import classnames from 'classnames'

/**
 * Menu component
 * @returns {Component|null}
 */
export function Menu (props) {
  const { className, children, isShowing } = props
  return isShowing
    ? <div className={classnames('menu', className)}>{children}</div>
    : null
}

Menu.defaultProps = {
  className: '',
  isShowing: false,
  children: null,
}

Menu.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  isShowing: PropTypes.bool,
}

export function Item (props) {
  const {
    icon,
    children,
    text,
    subText,
    className,
    onClick,
  } = props

  const itemClassName = classnames('menu__item', className, {
    'menu__item--clickable': Boolean(onClick),
  })
  return children
    ? <div className={itemClassName} onClick={onClick}>{children}</div>
    : (
      <div
        className={itemClassName}
        onClick={onClick}
      >
        {icon ? <div className="menu__item__icon">{icon}</div> : null}
        {text ? <div className="menu__item__text">{text}</div> : null}
        {subText ? <div className="menu__item__subtext">{subText}</div> : null}
      </div>
    )
}

Item.defaultProps = {
  children: null,
  icon: null,
  text: null,
  subText: null,
  className: '',
  onClick: null,
}

Item.propTypes = {
  icon: PropTypes.node,
  children: PropTypes.node,
  text: PropTypes.node,
  subText: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
}

export function Divider () {
  return <div className="menu__divider" />
}

export function CloseArea ({ onClick }) {
  return <div className="menu__close-area" onClick={onClick} />
}

CloseArea.propTypes = {
  onClick: PropTypes.func.isRequired,
}
