const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')


inherits(LoadingIndicator, Component)
module.exports = LoadingIndicator

function LoadingIndicator () {
  Component.call(this)
}

LoadingIndicator.prototype.render = function () {
  const { isLoading, loadingMessage } = this.props

  return (
    isLoading ? h('.full-flex-height', {
      style: {
        left: '0px',
        zIndex: 10,
        position: 'absolute',
        flexDirection: 'column',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.8)',
      },
    }, [
      h('img', {
        src: 'images/loading.svg',
      }),

      h('br'),

      showMessageIfAny(loadingMessage),
    ]) : null
  )
}

function showMessageIfAny (loadingMessage) {
  if (!loadingMessage) return null
  return h('span', loadingMessage)
}
