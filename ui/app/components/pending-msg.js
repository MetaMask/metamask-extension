const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const PendingTxDetails = require('./pending-msg-details')
const connect = require('react-redux').connect

PendingMsg.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect()(PendingMsg)


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
      }, this.context.t('signMessage')),

      h('.error', {
        style: {
          margin: '10px',
        },
      }, [
        this.context.t('signNotice'),
        h('a', {
          href: 'https://medium.com/metamask/the-new-secure-way-to-sign-data-in-your-browser-6af9dd2a1527',
          style: { color: 'rgb(247, 134, 28)' },
          onClick: (event) => {
            event.preventDefault()
            const url = 'https://medium.com/metamask/the-new-secure-way-to-sign-data-in-your-browser-6af9dd2a1527'
            global.platform.openWindow({ url })
          },
        }, this.context.t('readMore')),
      ]),

      // message details
      h(PendingTxDetails, state),

      // sign + cancel
      h('.flex-row.flex-space-around', [
        h('button', {
          onClick: state.cancelMessage,
        }, this.context.t('cancel')),
        h('button', {
          onClick: state.signMessage,
        }, this.context.t('sign')),
      ]),
    ])

  )
}
