import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import ReactCSSTransitionGroup from 'react-transition-group/CSSTransitionGroup'

export default class MenuDroppoComponent extends Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    innerStyle: PropTypes.object,
    children: PropTypes.node.isRequired,
    onClickOutside: PropTypes.func,
    containerClassName: PropTypes.string,
    zIndex: PropTypes.number,
    style: PropTypes.object.isRequired,
    useCssTransition: PropTypes.bool,
    speed: PropTypes.string,
  }

  renderPrimary() {
    const { isOpen } = this.props
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

  manageListeners() {
    const { isOpen, onClickOutside } = this.props

    if (isOpen) {
      this.outsideClickHandler = onClickOutside
    }
  }

  globalClickOccurred = (event) => {
    const { target } = event
    // eslint-disable-next-line react/no-find-dom-node
    const container = findDOMNode(this)

    if (
      target !== container &&
      !isDescendant(this.container, event.target) &&
      this.outsideClickHandler
    ) {
      this.outsideClickHandler(event)
    }
  }

  componentDidMount() {
    if (this && document.body) {
      document.body.addEventListener('click', this.globalClickOccurred)
      // eslint-disable-next-line react/no-find-dom-node
      const container = findDOMNode(this)
      this.container = container
    }
  }

  componentWillUnmount() {
    if (this && document.body) {
      document.body.removeEventListener('click', this.globalClickOccurred)
    }
  }

  render() {
    const { containerClassName = '', style } = this.props
    const speed = this.props.speed || '300ms'
    const { useCssTransition } = this.props
    const zIndex = 'zIndex' in this.props ? this.props.zIndex : 0

    this.manageListeners()

    const baseStyle = {
      position: 'fixed',
      ...style,
      zIndex,
    }

    return (
      <div
        style={baseStyle}
        className={`menu-droppo-container ${containerClassName}`}
      >
        <style>
          {`
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
        {useCssTransition ? (
          <ReactCSSTransitionGroup
            className="css-transition-group"
            transitionName="menu-droppo"
            transitionEnterTimeout={parseInt(speed, 10)}
            transitionLeaveTimeout={parseInt(speed, 10)}
          >
            {this.renderPrimary()}
          </ReactCSSTransitionGroup>
        ) : (
          this.renderPrimary()
        )}
      </div>
    )
  }
}

function isDescendant(parent, child) {
  let node = child.parentNode
  while (node !== null) {
    if (node === parent) {
      return true
    }
    node = node.parentNode
  }

  return false
}
