const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')


inherits(LoadingIndicator, Component)
module.exports = LoadingIndicator

function LoadingIndicator () {
  Component.call(this)
}

LoadingIndicator.prototype.render = function () {
  const { isLoading, loadingMessage, canBypass, bypass } = this.props

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
      canBypass ? h('i.fa.fa-close.cursor-pointer.close-loading', {
        style: {
          position: 'absolute',
          top: '1px',
          right: '15px',
          color: '#AEAEAE',
        },
        onClick: bypass,
      }) : null,

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
