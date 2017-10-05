const { inherits } = require('util')
const PersistentForm = require('../lib/persistent-form')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const Identicon = require('./components/identicon')

module.exports = connect(mapStateToProps)(SendTransactionScreen)

function mapStateToProps (state) {
  return {}
}

inherits(SendTransactionScreen, PersistentForm)
function SendTransactionScreen () {
  PersistentForm.call(this)

  this.state = {
    newTx: {
      from: '',
      to: '',
      amountToSend: '0x0',
      gasPrice: null,
      gas: null,
      amount: '0x0', 
      txData: null,
      memo: '',
    },
  }
}

SendTransactionScreen.prototype.render = function () {
  return (

    h('div.send-v2__container', [
      h('div.send-v2__header', {}, [

        h('img.send-v2__send-eth-icon', { src: '../images/eth_logo.svg' }),

        h('div.send-v2__arrow-background', [
          h('i.fa.fa-lg.fa-arrow-circle-right.send-v2__send-arrow-icon'),
        ]),

        h('div.send-v2__header-tip'),

      ]),

      h('div.send-v2__title', 'Send Funds'),

      h('div.send-v2__copy', 'Only send ETH to an Ethereum address.'),

      h('div.send-v2__copy', 'Sending to a different crytpocurrency that is not Ethereum may result in permanent loss.'),

      // Buttons underneath card
      h('div.send-v2__footer', [
        h('button.send-v2__cancel-btn', {}, 'Cancel'),
        h('button.send-v2__next-btn', {}, 'Next'),
      ]),
    ])

  )
}
