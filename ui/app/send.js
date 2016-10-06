const inherits = require('util').inherits
const PersistentForm = require('../lib/persistent-form')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const Identicon = require('./components/identicon')
const actions = require('./actions')
const util = require('./util')
const numericBalance = require('./util').numericBalance
const addressSummary = require('./util').addressSummary
const EthBalance = require('./components/eth-balance')
const ethUtil = require('ethereumjs-util')
const RangeSlider = require('./components/range-slider')
const Tooltip = require('./components/tooltip')
module.exports = connect(mapStateToProps)(SendTransactionScreen)

function mapStateToProps (state) {
  var result = {
    address: state.metamask.selectedAccount,
    accounts: state.metamask.accounts,
    identities: state.metamask.identities,
    warning: state.appState.warning,
  }

  result.error = result.warning && result.warning.split('.')[0]

  result.account = result.accounts[result.address]
  result.identity = result.identities[result.address]
  result.balance = result.account ? numericBalance(result.account.balance) : null

  return result
}

inherits(SendTransactionScreen, PersistentForm)
function SendTransactionScreen () {
  PersistentForm.call(this)
}

SendTransactionScreen.prototype.render = function () {
  this.persistentFormParentId = 'send-tx-form'

  var state = this.props
  var address = state.address
  var account = state.account
  var identity = state.identity

  return (

    h('.send-screen.flex-column.flex-grow', [

      //
      // Sender Profile
      //

      h('.account-data-subsection.flex-row.flex-grow', {
        style: {
          margin: '0 20px',
        },
      }, [

        // header - identicon + nav
        h('.flex-row.flex-space-between', {
          style: {
            marginTop: '15px',
          },
        }, [
          // back button
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

          // invisible place holder
          h('i.fa.fa-users.fa-lg.invisible', {
            style: {
              marginTop: '28px',
            },
          }),

        ]),

        // account label

        h('.flex-column', {
          style: {
            marginTop: '10px',
            alignItems: 'flex-start',
          },
        }, [
          h('h2.font-medium.color-forest.flex-center', {
            style: {
              paddingTop: '8px',
              marginBottom: '8px',
            },
          }, identity && identity.name),

          // address and getter actions
          h('.flex-row.flex-center', {
            style: {
              marginBottom: '8px',
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

            h(EthBalance, {
              value: account && account.balance,
            }),

          ]),
        ]),
      ]),

      //
      // Required Fields
      //

      h('h3.flex-center.text-transform-uppercase', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
          marginTop: '15px',
          marginBottom: '16px',
        },
      }, [
        'Send Transaction',
      ]),

      // error message
      state.error && h('span.error.flex-center', state.error),

      // 'to' field
      h('section.flex-row.flex-center', [
        h('input.large-input', {
          name: 'address',
          placeholder: 'Recipient Address',
          dataset: {
            persistentFormId: 'recipient-address',
          },
        }),
      ]),

      // 'amount' and send button
      h('section.flex-row.flex-center', [

        h('input.large-input', {
          name: 'amount',
          placeholder: 'Amount',
          type: 'number',
          style: {
            marginRight: '6px',
          },
          dataset: {
            persistentFormId: 'tx-amount',
          },
        }),

        h('button.primary', {
          onClick: this.onSubmit.bind(this),
          style: {
            textTransform: 'uppercase',
          },
        }, 'Send'),

      ]),

      //
      // Optional Fields
      //
      h('h3.flex-center.text-transform-uppercase', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
          marginTop: '16px',
          marginBottom: '16px',
        },
      }, [
        'Transactional Data (optional)',
      ]),

      // 'data' field
      h('section.flex-column.flex-center', [
        h('input.large-input', {
          name: 'txData',
          placeholder: '0x01234',
          style: {
            width: '100%',
            resize: 'none',
          },
          dataset: {
            persistentFormId: 'tx-data',
          },
        }),
      ]),
      // custom gas field
      h('h3.flex-center.text-transform-uppercase', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
          marginBottom: '5px',
        },
      }, [
        'Transaction Fee (optional)',
        h(Tooltip, {
          title: `
          This is used to set the transactions
          gas price. seting it to 100% will use
          the full recomend value.
          `,
        }, [
          h('i.fa.fa-question-circle', {
            style: {
              marginLeft: '5px',
            },
          }),
        ]),
      ]),

      h('section.flex-column.flex-center', [
        h('.flex-row', [
          h(RangeSlider, {
            name: 'gasInput',
            options: {
              mirrorInput: true,
              defaultValue: 100,
              min: 80,
              max: 220,
            },
            style: {
              container: {
                marginBottom: '16px',
              },
              range: {
                width: '68vw',
              },
              input: {
                width: '5em',
                marginLeft: '5px',
              },
            },
          }),

          h('div', {
            style: {
              fontSize: '12px',
              paddingTop: '8px',
              paddingLeft: '5px',
            },
          }, '%'),
        ]),
        h('.flex-row', {
          style: {
            justifyContent: 'space-between',
            width: '243px',
            position: 'relative',
            fontSize: '12px',
            right: '42px',
            bottom: '30px',
          },
        }, [
          h('span', 'Cheaper'), h('span', 'Faster'),
        ]),
      ]),
    ])
  )
}

SendTransactionScreen.prototype.navigateToAccounts = function (event) {
  event.stopPropagation()
  this.props.dispatch(actions.showAccountsPage())
}

SendTransactionScreen.prototype.back = function () {
  var address = this.props.address
  this.props.dispatch(actions.backToAccountDetail(address))
}

SendTransactionScreen.prototype.onSubmit = function (gasPrice) {
  const recipient = document.querySelector('input[name="address"]').value
  const input = document.querySelector('input[name="amount"]').value
  const value = util.normalizeEthStringToWei(input)
  const txData = document.querySelector('input[name="txData"]').value
  const gasMultiplier = document.querySelector('input[name="gasInput"]').value
  const balance = this.props.balance
  let message

  if (value.gt(balance)) {
    message = 'Insufficient funds.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  if (input < 0) {
    message = 'Can not send negative amounts of ETH.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  if ((!util.isValidAddress(recipient) && !txData) || (!recipient && !txData)) {
    message = 'Recipient address is invalid.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  this.props.dispatch(actions.hideWarning())

  var txParams = {
    from: this.props.address,
    value: '0x' + value.toString(16),
  }

  if (recipient) txParams.to = ethUtil.addHexPrefix(recipient)
  if (txData) txParams.data = txData
  txParams.gasMultiplier = gasMultiplier * 0.01
  this.props.dispatch(actions.signTx(txParams))
}
