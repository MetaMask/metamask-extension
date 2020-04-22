import React, { Component } from 'react'
import PropTypes from 'prop-types'
import MenuDroppo from './menu-droppo'
import extend from 'xtend'
import classnames from 'classnames'

const noop = () => {}

class Dropdown extends Component {
  static defaultProps = {
    isOpen: false,
    onClick: noop,
    useCssTransition: false,
  }

  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    children: PropTypes.node,
    style: PropTypes.object.isRequired,
    onClickOutside: PropTypes.func,
    innerStyle: PropTypes.object,
    useCssTransition: PropTypes.bool,
    constOverflow: PropTypes.bool,
  }

  render () {
    const {
      isOpen,
      onClickOutside,
      style,
      innerStyle,
      children,
      useCssTransition,
      constOverflow,
    } = this.props

    const innerStyleDefaults = extend({
      padding: '15px 30px',
      background: 'transparent',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    }, innerStyle)

    const styleDefaults = extend({
      borderRadius: '4px',
      background: 'rgba(71, 28, 115, 0.95)',
      overflowY: 'auto',
      transition: 'max-height 300ms ease-in-out',
    }, style)

    return (
      <MenuDroppo
        useCssTransition={useCssTransition}
        isOpen={isOpen}
        zIndex={11}
        constOverflow={constOverflow}
        onClickOutside={onClickOutside}
        style={styleDefaults}
        innerStyle={innerStyleDefaults}
      >
        <style>
        {`
          li.dropdown-menu-item:hover { color:#ffffff; }
          li.dropdown-menu-item { color: rgba(255, 255, 255, 0.5); position: relative }
        `}
        </style>
        {children}
      </MenuDroppo>
    )
  }
}

class DropdownMenuItem extends Component {
  static propTypes = {
    closeMenu: PropTypes.func,
    onClick: PropTypes.func.isRequired,
    children: PropTypes.node,
    style: PropTypes.object,
    className: PropTypes.string,
  }

  render () {
    const { onClick, closeMenu, children } = this.props
    const style = Object.assign({
      listStyle: 'none',
      padding: (this.props.style && this.props.style.padding) ? this.props.style.padding : '15px 0px',
      fontSize: '16px',
      fontStyle: 'normal',
      fontFamily: 'Nunito Regular',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
    }, this.props.style)

    return (
      <li
        className={classnames('dropdown-menu-item', this.props.className)}
        onClick={() => {
          onClick()
          closeMenu()
        }}
        style={style}
      >
        {children}
      </li>
    )
  }

}

module.exports = {
  Dropdown,
  DropdownMenuItem,
}
