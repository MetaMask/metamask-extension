const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('./actions')
const util = require('./util')
const numericBalance = require('./util').numericBalance
const AccountPanel = require('./components/account-panel')
const ethUtil = require('ethereumjs-util')

module.exports = connect(mapStateToProps)(SendTransactionScreen)

function mapStateToProps(state) {
  var result = {
    address: state.metamask.selectedAccount,
    accounts: state.metamask.accounts,
    identities: state.metamask.identities,
    warning: state.appState.warning,
  }

  result.account = result.accounts[result.address]
  result.identity = result.identities[result.address]
  result.balance = result.account ? numericBalance(result.account.balance) : null

  return result
}

inherits(SendTransactionScreen, Component)
function SendTransactionScreen() {
  Component.call(this)
}

SendTransactionScreen.prototype.render = function() {
  var state = this.props
  var account = state.account
  var identity = state.identity

  return (
    h('.send-screen.flex-column.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: this.back.bind(this),
        }),
        h('h2.page-subtitle', 'Send Transaction'),
      ]),

      h(AccountPanel, {
        showFullAddress: true,
        identity: identity,
        account: account,
      }),

      h('section.recipient', [
        h('input.address', {
          placeholder: 'Recipient Address',
        })
      ]),

      h('section.ammount', [
        h('input.ether', {
          placeholder: 'Amount',
          type: 'number',
          style: { marginRight: '6px' }
        }),
        h('select.currency', {
          name: 'currency',
        }, [
          h('option', { value: 'ether' }, 'Ether (1e18 wei)'),
          h('option', { value: 'wei' }, 'Wei'),
        ]),
      ]),

      h('section.data', [
        h('details', [
          h('summary', {
            style: {cursor: 'pointer'},
          }, 'Advanced'),
          h('textarea.txData', {
            type: 'textarea',
            placeholder: 'Transaction data (optional)',
            style: {
              height: '100px',
              width: '100%',
              resize: 'none',
            }
          })
        ])
      ]),

      h('section', {
      }, [
        h('button', {
          onClick: this.onSubmit.bind(this),
        }, 'Send')
      ]),

      state.warning ? h('span.error', state.warning.split('.')[0]) : null,
    ])
  )
}

SendTransactionScreen.prototype.back = function() {
  var address = this.props.address
  this.props.dispatch(actions.backToAccountDetail(address))
}

SendTransactionScreen.prototype.onSubmit = function(event) {
  var recipient = document.querySelector('input.address').value

  var inputAmount = parseFloat(document.querySelector('input.ether').value)
  var currency = document.querySelector('select.currency').value
  var value = util.normalizeNumberToWei(inputAmount, currency)

  var balance = this.props.balance

  if (value.gt(balance)) {
    var message = 'Insufficient funds.'
    return this.props.dispatch(actions.displayWarning(message))
  }
  if (recipient.length !== 42) {
    var message = 'Recipient address is the incorrect length.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  this.props.dispatch(actions.hideWarning())
  this.props.dispatch(actions.showLoadingIndication())

  var txParams = {
    to: recipient,
    from: this.props.address,
    value: '0x' + value.toString(16),
  }

  var txData = document.querySelector('textarea.txData').value
  if (txData) txParams.data = txData

  this.props.dispatch(actions.signTx(txParams))
}

