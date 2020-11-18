import React, { Component } from 'react'
import PropTypes from 'prop-types'

let index = 0
let extraSheet

const insertRule = (css) => {
  if (!extraSheet) {
    // First time, create an extra stylesheet for adding rules
    extraSheet = document.createElement('style')
    document.getElementsByTagName('head')[0].appendChild(extraSheet)
    // Keep reference to actual StyleSheet object (`styleSheet` for IE < 9)
    extraSheet = extraSheet.sheet || extraSheet.styleSheet
  }

  extraSheet.insertRule(css, (extraSheet.cssRules || extraSheet.rules).length)

  return extraSheet
}

const insertKeyframesRule = (keyframes) => {
  // random name
  // eslint-disable-next-line no-plusplus
  const name = `anim_${++index}${Number(new Date())}`
  let css = `@keyframes ${name} {`

  Object.keys(keyframes).forEach((key) => {
    css += `${key} {`

    Object.keys(keyframes[key]).forEach((property) => {
      const part = `:${keyframes[key][property]};`
      css += property + part
    })

    css += '}'
  })

  css += '}'

  insertRule(css)

  return name
}

const animation = {
  show: {
    animationDuration: '0.3s',
    animationTimingFunction: 'ease-out',
  },
  hide: {
    animationDuration: '0.3s',
    animationTimingFunction: 'ease-out',
  },
  showContentAnimation: insertKeyframesRule({
    '0%': {
      opacity: 0,
    },
    '100%': {
      opacity: 1,
    },
  }),
  hideContentAnimation: insertKeyframesRule({
    '0%': {
      opacity: 1,
    },
    '100%': {
      opacity: 0,
    },
  }),
  showBackdropAnimation: insertKeyframesRule({
    '0%': {
      opacity: 0,
    },
    '100%': {
      opacity: 0.9,
    },
  }),
  hideBackdropAnimation: insertKeyframesRule({
    '0%': {
      opacity: 0.9,
    },
    '100%': {
      opacity: 0,
    },
  }),
}

const endEvents = ['transitionend', 'animationend']

function addEventListener(node, eventName, eventListener) {
  node.addEventListener(eventName, eventListener, false)
}

function removeEventListener(node, eventName, eventListener) {
  node.removeEventListener(eventName, eventListener, false)
}

const removeEndEventListener = (node, eventListener) => {
  if (endEvents.length === 0) {
    return
  }
  endEvents.forEach(function (endEvent) {
    removeEventListener(node, endEvent, eventListener)
  })
}

const addEndEventListener = (node, eventListener) => {
  if (endEvents.length === 0) {
    // If CSS transitions are not supported, trigger an "end animation"
    // event immediately.
    window.setTimeout(eventListener, 0)
    return
  }
  endEvents.forEach(function (endEvent) {
    addEventListener(node, endEvent, eventListener)
  })
}

class FadeModal extends Component {
  content = null

  static propTypes = {
    backdrop: PropTypes.bool,
    backdropStyle: PropTypes.object,
    closeOnClick: PropTypes.bool,
    contentStyle: PropTypes.object,
    keyboard: PropTypes.bool,
    modalStyle: PropTypes.object,
    onShow: PropTypes.func,
    onHide: PropTypes.func,
    children: PropTypes.node,
  }

  static defaultProps = {
    onShow: () => undefined,
    onHide: () => undefined,
    keyboard: true,
    backdrop: true,
    closeOnClick: true,
    modalStyle: {},
    backdropStyle: {},
    contentStyle: {},
    children: [],
  }

  state = {
    willHide: true,
    hidden: true,
  }

  addTransitionListener = (node, handle) => {
    if (node) {
      const endListener = function (e) {
        if (e && e.target !== node) {
          return
        }
        removeEndEventListener(node, endListener)
        handle()
      }
      addEndEventListener(node, endListener)
    }
  }

  handleBackdropClick = () => {
    if (this.props.closeOnClick) {
      this.hide()
    }
  }

  hasHidden = () => {
    return this.state.hidden
  }

  render() {
    if (this.state.hidden) {
      return null
    }

    const { willHide } = this.state
    const { modalStyle } = this.props
    const backdropStyle = {
      animationName: willHide
        ? animation.hideBackdropAnimation
        : animation.showBackdropAnimation,
      animationTimingFunction: (willHide ? animation.hide : animation.show)
        .animationTimingFunction,
      ...this.props.backdropStyle,
    }
    const contentStyle = {
      animationDuration: (willHide ? animation.hide : animation.show)
        .animationDuration,
      animationName: willHide
        ? animation.hideContentAnimation
        : animation.showContentAnimation,
      animationTimingFunction: (willHide ? animation.hide : animation.show)
        .animationTimingFunction,
      ...this.props.contentStyle,
    }

    const backdrop = this.props.backdrop ? (
      <div
        className="modal__backdrop"
        style={backdropStyle}
        onClick={this.props.closeOnClick ? this.handleBackdropClick : null}
      />
    ) : undefined

    if (willHide) {
      this.addTransitionListener(this.content, this.leave)
    }

    return (
      <span>
        <div className="modal" style={modalStyle}>
          <div
            className="modal__content"
            ref={(el) => (this.content = el)}
            tabIndex="-1"
            style={contentStyle}
          >
            {this.props.children}
          </div>
        </div>
        {backdrop}
      </span>
    )
  }

  leave = () => {
    this.setState({
      hidden: true,
    })
    this.props.onHide(this.state.hideSource)
  }

  enter = () => {
    this.props.onShow()
  }

  show = () => {
    if (!this.state.hidden) {
      return
    }

    this.setState({
      willHide: false,
      hidden: false,
    })

    setTimeout(
      function () {
        this.addTransitionListener(this.content, this.enter)
      }.bind(this),
      0,
    )
  }

  hide = () => {
    if (this.hasHidden()) {
      return
    }

    this.setState({
      willHide: true,
    })
  }

  listenKeyboard = (event) => {
    if (typeof this.props.keyboard === 'function') {
      this.props.keyboard(event)
    } else {
      this.closeOnEsc(event)
    }
  }

  closeOnEsc = (event) => {
    if (
      this.props.keyboard &&
      (event.key === 'Escape' || event.keyCode === 27)
    ) {
      this.hide()
    }
  }

  UNSAFE_componentDidMount = () => {
    window.addEventListener('keydown', this.listenKeyboard, true)
  }

  UNSAFE_componentWillUnmount = () => {
    window.removeEventListener('keydown', this.listenKeyboard, true)
  }
}

export default FadeModal
