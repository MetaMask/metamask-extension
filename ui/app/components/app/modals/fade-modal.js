import React from 'react'
import PropTypes from 'prop-types'
import transitionEvents from 'domkit/transitionEvents'
import appendVendorPrefix from 'domkit/appendVendorPrefix'
import insertKeyframesRule from 'domkit/insertKeyframesRule'

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

class FadeModal extends React.Component {
  static propTypes = {
    animation: PropTypes.object,
    backdrop: PropTypes.bool,
    backdropStyle: PropTypes.object,
    className: PropTypes.string,
    closeOnClick: PropTypes.bool,
    contentStyle: PropTypes.object,
    keyboard: PropTypes.bool,
    modalStyle: PropTypes.object,
    onShow: PropTypes.func,
    onHide: PropTypes.func,
  }

  static defaultProps = {
    className: '',
    onShow: function () {},
    onHide: function () {},
    animation: animation,
    keyboard: true,
    backdrop: true,
    closeOnClick: true,
    modalStyle: {},
    backdropStyle: {},
    contentStyle: {},
  }

  state = {
    willHide: true,
    hidden: true,
  }

  addTransitionListener (node, handle) {
    if (node) {
      var endListener = function (e) {
        if (e && e.target !== node) {
          return
        }
        transitionEvents.removeEndEventListener(node, endListener)
        handle()
      }
      transitionEvents.addEndEventListener(node, endListener)
    }
  }

  handleBackdropClick () {
    if (this.props.closeOnClick) {
      this.hide()
    }
  }

  render () {
    if (this.state.hidden) {
      return null
    }

    const willHide = this.state.willHide
    const animation = this.props.animation
    const modalStyle = appendVendorPrefix({
        zIndex: 1050,
        position: 'fixed',
        width: '500px',
        transform: 'translate3d(-50%, -50%, 0)',
        top: '50%',
        left: '50%',
    })
    const backdropStyle = appendVendorPrefix({
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 1040,
      backgroundColor: '#373A47',
      animationFillMode: 'forwards',
      animationDuration: '0.3s',
      animationName: willHide ? animation.hideBackdropAnimation : animation.showBackdropAnimation,
      animationTimingFunction: (willHide ? animation.hide : animation.show).animationTimingFunction,
    })
    const contentStyle = appendVendorPrefix({
      margin: 0,
      backgroundColor: 'white',
      animationDuration: (willHide ? animation.hide : animation.show).animationDuration,
      animationFillMode: 'forwards',
      animationName: willHide ? animation.hideContentAnimation : animation.showContentAnimation,
      animationTimingFunction: (willHide ? animation.hide : animation.show).animationTimingFunction,
    })
    const ref = animation.getRef(willHide)
    const sharp = animation.getSharp && animation.getSharp(willHide)

    // Apply custom style properties
    if (this.props.modalStyle) {
      var prefixedModalStyle = appendVendorPrefix(this.props.modalStyle)
      for (const style in prefixedModalStyle) {
        modalStyle[style] = prefixedModalStyle[style]
      }
    }

    if (this.props.backdropStyle) {
      const prefixedBackdropStyle = appendVendorPrefix(this.props.backdropStyle)
      for (const style in prefixedBackdropStyle) {
        backdropStyle[style] = prefixedBackdropStyle[style]
      }
    }

    if (this.props.contentStyle) {
      const prefixedContentStyle = appendVendorPrefix(this.props.contentStyle)
      for (const style in prefixedContentStyle) {
        contentStyle[style] = prefixedContentStyle[style]
      }
    }

    const backdrop = this.props.backdrop ? <div style={backdropStyle} onClick={this.props.closeOnClick ? this.handleBackdropClick : null} /> : undefined

    if (willHide) {
      const node = this.refs[ref]
      this.addTransitionListener(node, this.leave)
    }

    return (<span>
      <div ref="modal" style={modalStyle} className={this.props.className}>
        {sharp}
        <div ref="content" tabIndex="-1" style={contentStyle}>
          {this.props.children}
        </div>
      </div>
      {backdrop}
    </span>)

  }

  leave () {
    this.setState({
      hidden: true,
    })
    this.props.onHide(this.state.hideSource)
  }

  enter () {
    this.props.onShow()
  }

  show () {
    if (!this.state.hidden) return

    this.setState({
      willHide: false,
      hidden: false,
    })

    setTimeout(function () {
      var ref = this.props.animation.getRef()
      var node = this.refs[ref]
      this.addTransitionListener(node, this.enter)
    }.bind(this), 0)
  }

  hide () {
    if (this.hasHidden()) return

    this.setState({
      willHide: true,
    })
  }

  toggle () {
    if (this.hasHidden()) {
      this.show()
    } else {
      this.hide()
    }
  }

  listenKeyboard (event) {
    if (typeof this.props.keyboard === 'function') {
      this.props.keyboard(event)
    } else {
      this.closeOnEsc(event)
    }
  }

  closeOnEsc (event) {
    if (this.props.keyboard &&
      (event.key === 'Escape' ||
        event.keyCode === 27)) {
      this.hide()
    }
  }

  componentDidMount () {
    window.addEventListener('keydown', this.listenKeyboard, true)
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.listenKeyboard, true)
  }
}

export default FadeModal
