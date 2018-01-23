const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const PendingTxDetails = require('./pending-msg-details')

module.exports = PendingMsg

inherits(PendingMsg, Component)
function PendingMsg () {
  Component.call(this)
}

PendingMsg.prototype.render = function () {
  var state = this.props
  var msgData = state.txData

  return (

    h('div', {
      key: msgData.id,
      style: {
        maxWidth: '350px',
      },
    }, [

      // header
      h('h3', {
        style: {
          fontWeight: 'bold',
          textAlign: 'center',
        },
      }, t('signMessage')),

      h('.error', {
        style: {
          margin: '10px',
        },
      }, [
        t('signNotice'),
        h('a', {
          href: 'https://medium.com/metamask/the-new-secure-way-to-sign-data-in-your-browser-6af9dd2a1527',
          style: { color: 'rgb(247, 134, 28)' },
          onClick: (event) => {
            event.preventDefault()
            const url = 'https://medium.com/metamask/the-new-secure-way-to-sign-data-in-your-browser-6af9dd2a1527'
            global.platform.openWindow({ url })
          },
        }, t('readMore')),
      ]),

      // message details
      h(PendingTxDetails, state),

      // sign + cancel
      h('.flex-row.flex-space-around', [
        h('button', {
          onClick: state.cancelMessage,
        }, t('cancel')),
        h('button', {
          onClick: state.signMessage,
        }, t('sign')),
      ]),
    ])

  )
}
