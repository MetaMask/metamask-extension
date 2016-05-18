const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const Identicon = require('./components/identicon')
const actions = require('./actions')
const util = require('./util')
const numericBalance = require('./util').numericBalance
const formatBalance = require('./util').formatBalance
const addressSummary = require('./util').addressSummary
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
  var address = state.address
  var account = state.account
  var identity = state.identity

  return (

    h('.send-screen.flex-column.flex-grow', [

      //
      // Sender Profile
      //

      h('.account-data-subsection.flex-column.flex-grow', {
        style: {
          margin: '0 20px',
        },
      }, [

        // header - identicon + nav
        h('.flex-row.flex-space-between', {
          style: {
            marginTop: 28,
          },
        }, [

          // invisible placeholder for later
          h('i.fa.fa-arrow-left.fa-lg.cursor-pointer.color-orange', {
            onClick: this.back.bind(this),
          }),

          // large identicon
          h('.identicon-wrapper.flex-column.flex-center.select-none', [
            h(Identicon, {
              diameter: 62,
              address: address,
            }),
          ]),

          // small accounts nav
          h('i.fa.fa-users.fa-lg.cursor-pointer.color-orange', {
            onClick: this.navigateToAccounts.bind(this),
          }),

        ]),

        // account label
        h('h2.font-medium.color-forest.flex-center', {
          style: {
            paddingTop: 8,
            marginBottom: 8,
          },
        }, identity && identity.name),

        // address and getter actions
        h('.flex-row.flex-center', {
          style: {
            marginBottom: 8,
          },
        }, [

          h('div', {
            style: {
              lineHeight: '16px',
            },
          }, addressSummary(address)),

        ]),

        // balance
        h('.flex-row.flex-center', [

          h('div', formatBalance(account && account.balance)),

        ]),

      ]),

      //
      // Required Fields
      //

      h('h3.flex-center.text-transform-uppercase', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
          marginTop: 32,
          marginBottom: 16,
        },
      }, [
        'Send Transaction',
      ]),

      // 'to' field
      h('section.flex-row.flex-center', [
        h('input.address.large-input', {
          placeholder: 'Recipient Address',
        })
      ]),

      // 'amount' and send button
      h('section.flex-row.flex-center', [

        h('input.ether.large-input', {
          placeholder: 'Amount',
          type: 'number',
          style: {
            marginRight: 6,
          },
        }),

        h('button.primary', {
          onClick: this.onSubmit.bind(this),
          style: {
            textTransform: 'uppercase',
          },
        }, 'Send')

      ]),

      //
      // Optional Fields
      //

      h('h3.flex-center.text-transform-uppercase', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
          marginTop: 16,
          marginBottom: 16,
        },
      }, [
        'Tranasactional Data (optional)',
      ]),

      // 'data' field
      h('section.flex-row.flex-center', [
        h('input.txData.large-input', {
          placeholder: '0x01234',
          style: {
            width: '100%',
            resize: 'none',
          }
        }),
      ]),

      // state.warning ? h('span.error', state.warning.split('.')[0]) : null,

    ])

  )
}

SendTransactionScreen.prototype.navigateToAccounts = function(event){
  event.stopPropagation()
  this.props.dispatch(actions.showAccountsPage())
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

