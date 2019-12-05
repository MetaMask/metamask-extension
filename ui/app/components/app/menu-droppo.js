import React, { Component } from 'react'
const inherits = require('util').inherits
const findDOMNode = require('react-dom').findDOMNode
const ReactCSSTransitionGroup = require('react-transition-group/CSSTransitionGroup')

module.exports = MenuDroppoComponent


inherits(MenuDroppoComponent, Component)
function MenuDroppoComponent () {
  Component.call(this)
}

MenuDroppoComponent.prototype.render = function () {
  const { containerClassName = '' } = this.props
  const speed = this.props.speed || '300ms'
  const useCssTransition = this.props.useCssTransition
  const zIndex = ('zIndex' in this.props) ? this.props.zIndex : 0

  this.manageListeners()

  const style = this.props.style || {}
  if (!('position' in style)) {
    style.position = 'fixed'
  }
  style.zIndex = zIndex

  return (
    <div style={style} className={`menu-droppo-container ${containerClassName}`}>
      <style>{`
          .menu-droppo-enter {
            transition: transform ${speed} ease-in-out;
            transform: translateY(-200%);
          }

          .menu-droppo-enter.menu-droppo-enter-active {
            transition: transform ${speed} ease-in-out;
            transform: translateY(0%);
          }

          .menu-droppo-leave {
            transition: transform ${speed} ease-in-out;
            transform: translateY(0%);
          }

          .menu-droppo-leave.menu-droppo-leave-active {
            transition: transform ${speed} ease-in-out;
            transform: translateY(-200%);
          }
        `}
      </style>
      {
        useCssTransition
          ? (
            <ReactCSSTransitionGroup
              className="css-transition-group"
              transitionName="menu-droppo"
              transitionEnterTimeout={parseInt(speed)}
              transitionLeaveTimeout={parseInt(speed)}
            >
              {this.renderPrimary()}
            </ReactCSSTransitionGroup>
          )
          : this.renderPrimary()
      }
    </div>
  )
}

MenuDroppoComponent.prototype.renderPrimary = function () {
  const isOpen = this.props.isOpen
  if (!isOpen) {
    return null
  }

  const innerStyle = this.props.innerStyle || {}

  return (
    <div className="menu-droppo" key="menu-droppo-drawer" style={innerStyle}>
      {this.props.children}
    </div>
  )
}

MenuDroppoComponent.prototype.manageListeners = function () {
  const isOpen = this.props.isOpen
  const onClickOutside = this.props.onClickOutside

  if (isOpen) {
    this.outsideClickHandler = onClickOutside
  } else if (isOpen) {
    this.outsideClickHandler = null
  }
}

MenuDroppoComponent.prototype.componentDidMount = function () {
  if (this && document.body) {
    this.globalClickHandler = this.globalClickOccurred.bind(this)
    document.body.addEventListener('click', this.globalClickHandler)
    // eslint-disable-next-line react/no-find-dom-node
    const container = findDOMNode(this)
    this.container = container
  }
}

MenuDroppoComponent.prototype.componentWillUnmount = function () {
  if (this && document.body) {
    document.body.removeEventListener('click', this.globalClickHandler)
  }
}

MenuDroppoComponent.prototype.globalClickOccurred = function (event) {
  const target = event.target
  // eslint-disable-next-line react/no-find-dom-node
  const container = findDOMNode(this)

  if (target !== container &&
    !isDescendant(this.container, event.target) &&
    this.outsideClickHandler) {
    this.outsideClickHandler(event)
  }
}

function isDescendant (parent, child) {
  let node = child.parentNode
  while (node !== null) {
    if (node === parent) {
      return true
    }
    node = node.parentNode
  }

  return false
}
