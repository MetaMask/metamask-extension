import React, { Component } from 'react'
import PropTypes from 'prop-types'
import h from 'react-hyperscript'
import { findDOMNode } from 'react-dom'
import { CSSTransitionGroup } from 'react-transition-group'

export default class MenuDroppo extends Component {

  constructor (props) {
    super(props)
    this.menuDroppoContainer = React.createRef()
  }

  static propTypes = {
    speed: PropTypes.string,
    useCssTransition: PropTypes.bool,
    zIndex: PropTypes.number,
    isOpen: PropTypes.bool,
    innerStyle: PropTypes.object,
    children: PropTypes.array,
    onClickOutside: PropTypes.func,
    style: PropTypes.object,
    constOverflow: PropTypes.bool,
  }

  render () {
    const speed = this.props.speed || '300ms'
    const useCssTransition = this.props.useCssTransition
    const zIndex = ('zIndex' in this.props) ? this.props.zIndex : 0

    this.manageListeners()

    const style = this.props.style || {}
    if (!('position' in style)) {
      style.position = 'fixed'
    }
    style.zIndex = zIndex
    style.overflow = 'hidden'

    return (
      h('.menu-droppo-container', {
        ref: this.menuDroppoContainer,
        style,
      }, [
        // this.renderPrimary(),
        useCssTransition
          ? h(CSSTransitionGroup, {
            className: 'css-transition-group',
            transitionName: 'menu-droppo',
            transitionEnterTimeout: parseInt(speed),
            transitionLeaveTimeout: parseInt(speed),
          }, this.renderPrimary())
          : this.renderPrimary(),
      ])
    )
  }

  renderPrimary () {
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

  manageListeners () {
    const isOpen = this.props.isOpen
    const onClickOutside = this.props.onClickOutside

    if (isOpen) {
      this.outsideClickHandler = onClickOutside
    } else if (isOpen) {
      this.outsideClickHandler = null
    }
  }

  componentDidMount () {
    if (this && document.body) {
      this.globalClickHandler = this.globalClickOccurred.bind(this)
      document.body.addEventListener('click', this.globalClickHandler)
      // eslint-disable-next-line react/no-find-dom-node
      var container = findDOMNode(this)
      this.container = container
    }

    this.transitionStarted = this.transitionstartOccured.bind(this)

    /*
     * transitionstart event is not supported in Chrome yet. But it works for Firefox 53+.
     * We need to handle this event only for FF because for Chrome we've hidden scrolls.
    */
    this.menuDroppoContainer.current.addEventListener('transitionstart', this.transitionStarted)

    this.transitionEnded = this.transitionendOccured.bind(this)

    this.menuDroppoContainer.current.addEventListener('transitionend', this.transitionEnded)
  }

  componentWillUnmount () {
    if (this && document.body) {
      document.body.removeEventListener('click', this.globalClickHandler)
      document.body.removeEventListener('transitionstart', this.transitionStarted)
      document.body.removeEventListener('transitionend', this.transitionEnded)
    }
  }

  globalClickOccurred (event) {
    const target = event.target
    // eslint-disable-next-line react/no-find-dom-node
    const container = findDOMNode(this)

    if (target !== container &&
      !this.isDescendant(this.container, event.target) &&
      this.outsideClickHandler) {
      this.outsideClickHandler(event)
    }
  }

  transitionstartOccured (event) {
    this.menuDroppoContainer.current.style.overflow = 'hidden'
  }

  transitionendOccured (event) {
    if (!this.props.constOverflow) {
      this.menuDroppoContainer.current.style.overflow = 'auto'
    }
  }

  isDescendant (parent, child) {
    var node = child.parentNode
    while (node !== null) {
      if (node === parent) {
        return true
      }
      node = node.parentNode
    }

    return false
  }

}
