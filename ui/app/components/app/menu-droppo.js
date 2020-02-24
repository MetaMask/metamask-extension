<<<<<<< HEAD
const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const findDOMNode = require('react-dom').findDOMNode
const ReactCSSTransitionGroup = require('react-transition-group/CSSTransitionGroup')
=======
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
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

  renderPrimary () {
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

  manageListeners () {
    const isOpen = this.props.isOpen
    const onClickOutside = this.props.onClickOutside

    if (isOpen) {
      this.outsideClickHandler = onClickOutside
    } else if (isOpen) {
      this.outsideClickHandler = null
    }
  }

  globalClickOccurred = (event) => {
    const target = event.target
    // eslint-disable-next-line react/no-find-dom-node
    const container = findDOMNode(this)

    if (target !== container &&
      !isDescendant(this.container, event.target) &&
      this.outsideClickHandler) {
      this.outsideClickHandler(event)
    }
  }

  componentDidMount () {
    if (this && document.body) {
      document.body.addEventListener('click', this.globalClickHandler)
      // eslint-disable-next-line react/no-find-dom-node
      const container = findDOMNode(this)
      this.container = container
    }
  }

  componentWillUnmount () {
    if (this && document.body) {
      document.body.removeEventListener('click', this.globalClickHandler)
    }
  }

<<<<<<< HEAD
  return (
    h('div', {
      style,
      className: `.menu-droppo-container ${containerClassName}`,
    }, [
      h('style', `
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
      `),

      useCssTransition
        ? h(ReactCSSTransitionGroup, {
          className: 'css-transition-group',
          transitionName: 'menu-droppo',
          transitionEnterTimeout: parseInt(speed),
          transitionLeaveTimeout: parseInt(speed),
        }, this.renderPrimary())
        : this.renderPrimary(),
    ])
  )
}

MenuDroppoComponent.prototype.renderPrimary = function () {
  const isOpen = this.props.isOpen
  if (!isOpen) {
    return null
  }

  const innerStyle = this.props.innerStyle || {}

  return (
    h('.menu-droppo', {
      key: 'menu-droppo-drawer',
      style: innerStyle,
    },
    [ this.props.children ])
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
    var container = findDOMNode(this)
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
=======
  render () {
    const { containerClassName = '', style } = this.props
    const speed = this.props.speed || '300ms'
    const useCssTransition = this.props.useCssTransition
    const zIndex = ('zIndex' in this.props) ? this.props.zIndex : 0

    this.manageListeners()

    const baseStyle = Object.assign(
      { position: 'fixed' },
      style,
      { zIndex },
    )

    return (
      <div style={baseStyle} className={`menu-droppo-container ${containerClassName}`}>
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
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
  }
}

function isDescendant (parent, child) {
  var node = child.parentNode
  while (node !== null) {
    if (node === parent) {
      return true
    }
    node = node.parentNode
  }

  return false
}
