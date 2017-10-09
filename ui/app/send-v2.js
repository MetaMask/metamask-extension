const { inherits } = require('util')
const PersistentForm = require('../lib/persistent-form')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const FromDropdown = require('./components/send/from-dropdown')

module.exports = connect(mapStateToProps)(SendTransactionScreen)

function mapStateToProps (state) {
  const mockAccounts = Array.from(new Array(5))
    .map((v, i) => ({
      identity: {
        name: `Test Account Name ${i}`,
        address: `0x02f567704cc6569127e18e3d00d2c85bcbfa6f0${i}`,
      },
      balancesToRender: {
        primary: `100${i}.000001 ETH`,
        secondary: `$30${i},000.00 USD`,
      }
    }))

  return { accounts: mockAccounts }
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
    dropdownOpen: false,
  }
}

SendTransactionScreen.prototype.render = function () {
  const { accounts } = this.props
  const { dropdownOpen } = this.state

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

      h('div.send-v2__form', {}, [

        h('div.send-v2__form-row', [

          h('div.send-v2__form-label', 'From:'),

          h(FromDropdown, {
            dropdownOpen,
            accounts,
            selectedAccount: accounts[0],
            setFromField: () => console.log('Set From Field'),
            openDropdown: () => this.setState({ dropdownOpen: true }),
            closeDropdown: () => this.setState({ dropdownOpen: false }),
          }),

        ])

      ]),

      // Buttons underneath card
      h('div.send-v2__footer', [
        h('button.send-v2__cancel-btn', {}, 'Cancel'),
        h('button.send-v2__next-btn', {}, 'Next'),
      ]),
    ])

  )
}
