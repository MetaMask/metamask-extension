const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const findDOMNode = require('react-dom').findDOMNode
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')

module.exports = MenuDroppoComponent


inherits(MenuDroppoComponent, Component)
function MenuDroppoComponent () {
  Component.call(this)
}

MenuDroppoComponent.prototype.render = function () {
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
      ref: 'menuDroppoContainer',
      style,
    }, [
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

  /*
   * transitionstart event is not supported in Chrome yet. But it works for Firefox 53+.
   * We need to handle this event only for FF because for Chrome we've hidden scrolls.
  */
  this.refs.menuDroppoContainer.addEventListener('transitionstart', () => {
    this.refs.menuDroppoContainer.style.overflow = 'hidden'
  })

  this.refs.menuDroppoContainer.addEventListener('transitionend', () => {
    if (!this.props.constOverflow) {
      this.refs.menuDroppoContainer.style.overflow = 'auto'
    }
  })
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
  var node = child.parentNode
  while (node !== null) {
    if (node === parent) {
      return true
    }
    node = node.parentNode
  }

  return false
}
