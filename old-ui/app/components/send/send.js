const inherits = require('util').inherits
const PersistentForm = require('../../../lib/persistent-form')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../../ui/app/actions')
const {
  numericBalance,
  isHex,
  normalizeEthStringToWei,
  isInvalidChecksumAddress,
  isValidAddress,
} = require('../../util')
const EnsInput = require('../ens-input')
const ethUtil = require('ethereumjs-util')
import SendProfile from './send-profile'
import SendHeader from './send-header'
import ErrorComponent from '../error'
import { getMetaMaskAccounts } from '../../../../ui/app/selectors'
module.exports = connect(mapStateToProps)(SendTransactionScreen)

function mapStateToProps (state) {
  const accounts = getMetaMaskAccounts(state)
  var result = {
    address: state.metamask.selectedAddress,
    accounts,
    identities: state.metamask.identities,
    warning: state.appState.warning,
    network: state.metamask.network,
    addressBook: state.metamask.addressBook,
  }

  result.error = result.warning && result.warning.split('.')[0]
  result.account = result.accounts[result.address]
  result.balance = result.account ? numericBalance(result.account.balance) : null

  return result
}

inherits(SendTransactionScreen, PersistentForm)
function SendTransactionScreen () {
  PersistentForm.call(this)
}

SendTransactionScreen.prototype.render = function () {
  this.persistentFormParentId = 'send-tx-form'

  const props = this.props
  const {
    network,
    identities,
    addressBook,
    error,
  } = props

  return (

    h('.send-screen.flex-column.flex-grow', [

      //
      // Sender Profile
      //

      h(SendProfile),

      //
      // Send Header
      //

      h(SendHeader, {
        title: 'Send Transaction',
      }),

      // error message
      h(ErrorComponent, {
        error,
      }),

      // 'to' field
      h('section.flex-row.flex-center', [
        h(EnsInput, {
          name: 'address',
          placeholder: 'Recipient Address',
          onChange: this.recipientDidChange.bind(this),
          network,
          identities,
          addressBook,
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

        h('button', {
          onClick: this.onSubmit.bind(this),
        }, 'Next'),

      ]),

      //
      // Optional Fields
      //
      h('h3.flex-center', {
        style: {
          background: '#ffffff',
          color: '#333333',
          marginTop: '16px',
          marginBottom: '16px',
        },
      }, [
        'Transaction Data (optional)',
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
    ])
  )
}

SendTransactionScreen.prototype.componentWillUnmount = function () {
  this.props.dispatch(actions.displayWarning(''))
}

SendTransactionScreen.prototype.navigateToAccounts = function (event) {
  event.stopPropagation()
  this.props.dispatch(actions.showAccountsPage())
}

SendTransactionScreen.prototype.recipientDidChange = function (recipient, nickname) {
  this.setState({
    recipient: recipient,
    nickname: nickname,
  })
}

SendTransactionScreen.prototype.onSubmit = function () {
  const state = this.state || {}
  const recipient = state.recipient || document.querySelector('input[name="address"]').value.replace(/^[.\s]+|[.\s]+$/g, '')
  const nickname = state.nickname || ' '
  const input = document.querySelector('input[name="amount"]').value
  const parts = input.split('.')

  let message

  if (isNaN(input) || input === '') {
    message = 'Invalid ether value.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  if (parts[1]) {
    var decimal = parts[1]
    if (decimal.length > 18) {
      message = 'Ether amount is too precise.'
      return this.props.dispatch(actions.displayWarning(message))
    }
  }

  const value = normalizeEthStringToWei(input)
  const txData = document.querySelector('input[name="txData"]').value
  const balance = this.props.balance

  if (value.gt(balance)) {
    message = 'Insufficient funds.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  if (input < 0) {
    message = 'Can not send negative amounts of ETH.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  if ((isInvalidChecksumAddress(recipient))) {
    message = 'Recipient address checksum is invalid.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  if ((!isValidAddress(recipient) && !txData) || (!recipient && !txData)) {
    message = 'Recipient address is invalid.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  if (!isHex(ethUtil.stripHexPrefix(txData)) && txData) {
    message = 'Transaction data must be hex string.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  this.props.dispatch(actions.hideWarning())

  this.props.dispatch(actions.addToAddressBook(recipient, nickname))

  var txParams = {
    from: this.props.address,
    value: '0x' + value.toString(16),
  }

  if (recipient) txParams.to = ethUtil.addHexPrefix(recipient)
  if (txData) txParams.data = txData

  this.props.dispatch(actions.signTx(txParams))
}
