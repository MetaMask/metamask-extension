import React, { Component } from 'react'
import PropTypes from 'prop-types'
import MenuDroppo from '../../menu-droppo'

export class Dropdown extends Component {
  render() {
    const {
      containerClassName,
      isOpen,
      onClickOutside,
      style,
      innerStyle,
      children,
      useCssTransition,
    } = this.props

    const innerStyleDefaults = {
      borderRadius: '4px',
      padding: '8px 16px',
      background: 'rgba(0, 0, 0, 0.8)',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
      ...innerStyle,
    }

    return (
      <MenuDroppo
        containerClassName={containerClassName}
        useCssTransition={useCssTransition}
        isOpen={isOpen}
        zIndex={55}
        onClickOutside={onClickOutside}
        style={style}
        innerStyle={innerStyleDefaults}
      >
        <style>
          {`
            li.dropdown-menu-item:hover {
              color:rgb(225, 225, 225);
              background-color: rgba(255, 255, 255, 0.05);
              border-radius: 4px;
            }
            li.dropdown-menu-item { color: rgb(185, 185, 185); }
          `}
        </style>
        {children}
      </MenuDroppo>
    )
  }
}

Dropdown.defaultProps = {
  useCssTransition: false,
}

Dropdown.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  children: PropTypes.node,
  style: PropTypes.object.isRequired,
  onClickOutside: PropTypes.func,
  innerStyle: PropTypes.object,
  useCssTransition: PropTypes.bool,
  containerClassName: PropTypes.string,
}

export class DropdownMenuItem extends Component {
  render() {
    const { onClick, closeMenu, children, style } = this.props

    return (
      <li
        className="dropdown-menu-item"
        onClick={() => {
          onClick()
          closeMenu()
        }}
        style={{
          listStyle: 'none',
          padding: '8px 0px',
          fontSize: '18px',
          fontStyle: 'normal',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          color: 'white',
          ...style,
        }}
      >
        {children}
      </li>
    )
  }
}

DropdownMenuItem.propTypes = {
  closeMenu: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
  style: PropTypes.object,
}
