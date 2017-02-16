const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')


inherits(LoadingIndicator, Component)
module.exports = LoadingIndicator

function LoadingIndicator () {
  Component.call(this)
}

LoadingIndicator.prototype.render = function () {
  const { isLoading, loadingMessage } = this.props

  return (
    h(ReactCSSTransitionGroup, {
      className: 'css-transition-group',
      transitionName: 'loader',
      transitionEnterTimeout: 150,
      transitionLeaveTimeout: 150,
    }, [

      isLoading ? h('div', {
        style: {
          zIndex: 10,
          position: 'absolute',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.5)',
        },
      }, [
        h('img', {
          src: 'images/loading.svg',
        }),

        showMessageIfAny(loadingMessage),
      ]) : null,
    ])
  )
}

function showMessageIfAny (loadingMessage) {
  if (!loadingMessage) return null
  return h('span', loadingMessage)
}
